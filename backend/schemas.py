from pydantic import BaseModel, EmailStr
from typing import Optional

# Что нужно отправить для регистрации
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# Что бэкенд вернет после успешного входа
class Token(BaseModel):
    access_token: str
    token_type: str

# Данные, которые зашиты внутри токена
class TokenData(BaseModel):
    username: Optional[str] = None