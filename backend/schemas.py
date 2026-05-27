from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
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
    image_url: Optional[str] = None

class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price_per_day: float
    category_id: int
    owner_id: int
    is_available: bool
    image_url: Optional[str] = None
    owner_username: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    bio: Optional[str]
    city: Optional[str]
    avatar_url: Optional[str]
    rating: float

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    item_id: int
    rating: int
    comment: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    slug: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True