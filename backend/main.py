from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from database import engine, get_db

# Создаем таблицы в БД
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Бэкенд запущен, таблицы синхронизированы с БД!"}

# Тестовый эндпоинт для проверки связи с БД
@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "Подключение к базе данных успешно!"}