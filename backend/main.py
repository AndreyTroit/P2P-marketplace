from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import List

import datetime
import jwt
import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен или истек срок действия")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user

#РЕГИСТРАЦИЯ
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Пользователь успешно зарегистрирован", "user_id": new_user.id}

#АВТОРИЗАЦИЯ (ЛОГИН)
@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ВСЕ ВЕЩИ
@app.get("/items", response_model=List[schemas.ItemResponse])
def get_all_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return items

# СОЗДАНИЕ ВЕЩИ
@app.post("/items", response_model=schemas.ItemResponse)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_item = models.Item(
        title=item.title,
        description=item.description,
        price_per_day=item.price_per_day,
        category_id=item.category_id,
        owner_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# Получить вещи ТОЛЬКО текущего пользователя (для Личного Кабинета)
@app.get("/my/items", response_model=List[schemas.ItemResponse])
def get_my_items(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    my_items = db.query(models.Item).filter(models.Item.owner_id == current_user.id).all()
    return my_items



# 1. Получить профиль ТЕКУЩЕГО пользователя (с расчетом реального рейтинга)
@app.get("/users/me", response_model=schemas.UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Считаем средний рейтинг по всем вещам этого пользователя через отзывы
    # Находим все отзывы (Review), которые оставлены на вещи (Item), принадлежащие current_user.id
    avg_rating = db.query(func.avg(models.Review.rating)).join(
        models.Booking, models.Review.booking_id == models.Booking.id
    ).join(
        models.Item, models.Booking.item_id == models.Item.id
    ).filter(models.Item.owner_id == current_user.id).scalar()

    # Если отзывов еще нет, ставим дефолтный рейтинг 5.0
    user_rating = round(float(avg_rating), 1) if avg_rating else 5.0

    return schemas.UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        city=current_user.city,
        avatar_url=current_user.avatar_url,
        rating=user_rating
    )

# 2. Обновить данные профиля
@app.put("/users/me", response_model=schemas.UserProfileResponse)
def update_profile(profile_data: schemas.ProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.city is not None:
        current_user.city = profile_data.city
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
        
    db.commit()
    db.refresh(current_user)
    
    # Возвращаем обновленный профиль (рейтинг пересчитается)
    return get_my_profile(db, current_user)

# 3. Оставить отзыв на вещь (упрощенная схема: напрямую к Item через фейковое бронирование)
@app.post("/reviews")
def leave_review(review: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Для выполнения требований связей создадим быстрое техническое бронирование (Booking)
    # чтобы привязать к нему Review (так как в нашей БД Review ссылается на Booking)
    tech_booking = models.Booking(
        item_id=review.item_id,
        renter_id=current_user.id,
        start_date=datetime.date.today(),
        end_date=datetime.date.today(),
        total_price=0.0,
        status="completed"
    )
    db.add(tech_booking)
    db.commit()
    db.refresh(tech_booking)

    # Теперь создаем сам отзыв
    new_review = models.Review(
        booking_id=tech_booking.id,
        author_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()
    return {"message": "Отзыв успешно добавлен, рейтинг пользователя обновлен!"}

# 1. Получить все категории (для выпадающего списка на фронтенде)
@app.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

# 2. Создать категорию (для "администратора" через Swagger/прямой запрос)
@app.post("/categories", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # Проверяем, нет ли уже такой категории
    db_cat = db.query(models.Category).filter(models.Category.slug == category.slug).first()
    if db_cat:
        raise HTTPException(status_code=400, detail="Категория с таким slug уже существует")
        
    new_category = models.Category(name=category.name, slug=category.slug)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category