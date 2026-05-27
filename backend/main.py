from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta, date
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


@app.get("/items", response_model=List[schemas.ItemResponse])
def get_all_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return items


@app.post("/items", response_model=schemas.ItemResponse)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_item = models.Item(
        title=item.title,
        description=item.description,
        price_per_day=item.price_per_day,
        category_id=item.category_id,
        owner_id=current_user.id,
        image_url=item.image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.put("/items/{item_id}")
def update_item(
    item_id: int, 
    updated_data: schemas.ItemCreate,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Вы можете редактировать только свои товары!"
        )
    
    item.title = updated_data.title
    item.description = updated_data.description
    item.price_per_day = updated_data.price_per_day
    item.category_id = updated_data.category_id
    item.image_url = updated_data.image_url

    db.commit()
    db.refresh(item)
    return {"status": "success", "message": "Товар успешно обновлен", "item": item}


@app.delete("/items/{item_id}")
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")
        
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Вы можете удалять только свои товары!"
        )
        
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Товар успешно удален из базы данных"}


@app.get("/my/items", response_model=List[schemas.ItemResponse])
def get_my_items(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    my_items = db.query(models.Item).filter(models.Item.owner_id == current_user.id).all()
    return my_items


@app.get("/users/me", response_model=schemas.UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    avg_rating = db.query(func.avg(models.Review.rating)).join(
        models.Booking, models.Review.booking_id == models.Booking.id
    ).join(
        models.Item, models.Booking.item_id == models.Item.id
    ).filter(models.Item.owner_id == current_user.id).scalar()

    user_rating = round(float(avg_rating), 1) if avg_rating else 0

    return schemas.UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        city=current_user.city,
        avatar_url=current_user.avatar_url,
        rating=user_rating
    )

@app.get("/users/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "city": user.city,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "rating": db.query(func.avg(models.Review.rating)).join(
            models.Booking, models.Review.booking_id == models.Booking.id
        ).join(
            models.Item, models.Booking.item_id == models.Item.id
        ).filter(models.Item.owner_id == user.id).scalar()
    }

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
    
    return get_my_profile(db, current_user)

@app.post("/reviews")
def leave_review(review: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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

    new_review = models.Review(
        booking_id=tech_booking.id,
        author_id=current_user.id, 
        rating=review.rating,     
        comment=review.comment 
    )
    db.add(new_review)
    db.commit()
    return {"status": "success", "message": "Отзыв успешно записан в БД!"}

@app.get("/users/{user_id}/reviews")
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    results = db.query(
        models.Review.id,
        models.Review.rating,
        models.Review.comment,
        models.Review.created_at,
        models.User.username.label("author_name"),
        models.Item.title.label("item_title")
    ).join(
        models.Booking, models.Review.booking_id == models.Booking.id
    ).join(
        models.Item, models.Booking.item_id == models.Item.id
    ).join(
        models.User, models.Review.author_id == models.User.id  # Автор отзыва
    ).filter(
        models.Item.owner_id == user_id # Отзывы на вещи именно этого владельца
    ).all()

    reviews_list = []
    for r in results:
        reviews_list.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.strftime("%d.%m.%Y") if r.created_at else "—",
            "author_name": r.author_name,
            "item_title": r.item_title
        })
    return reviews_list

@app.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/categories", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.slug == category.slug).first()
    if db_cat:
        raise HTTPException(status_code=400, detail="Категория с таким slug уже существует")
        
    new_category = models.Category(name=category.name, slug=category.slug)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@app.post("/bookings")
def create_booking(
    booking_data: schemas.BookingCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Item).filter(models.Item.id == booking_data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Вы не можете арендовать собственную вещь")

    if booking_data.start_date < date.today():
        raise HTTPException(status_code=400, detail="Дата начала не может быть в прошлом")
    if booking_data.end_date <= booking_data.start_date:
        raise HTTPException(status_code=400, detail="Дата окончания должна быть позже даты начала")

    days = (booking_data.end_date - booking_data.start_date).days
    total_price = days * item.price_per_day

    new_booking = models.Booking(
        item_id=booking_data.item_id,
        renter_id=current_user.id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        total_price=total_price,
        status="confirmed"
    )

    item.is_available = False 

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return {"status": "success", "booking": new_booking}