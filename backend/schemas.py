from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_per_day: float
    category_id: int

class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price_per_day: float
    category_id: int
    owner_id: int
    is_available: bool

    class Config:
        from_attributes = True