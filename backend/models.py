from sqlalchemy import Column, Integer, String, ForeignKey, TEXT, NUMERIC, BOOLEAN, TIMESTAMP, DATE, CheckConstraint
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(TEXT, nullable=True, default="")
    bio = Column(TEXT, nullable=True, default="О себе пока ничего не написано...")
    city = Column(String(100), nullable=True, default="Не указан")
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(TEXT, nullable=True)
    price_per_day = Column(NUMERIC(10, 2), nullable=False)
    image_url = Column(TEXT, nullable=True)
    is_available = Column(BOOLEAN, default=True)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    renter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DATE, nullable=False)
    end_date = Column(DATE, nullable=False)
    total_price = Column(NUMERIC(10, 2), nullable=False)
    status = Column(String(20), default="pending") # pending, confirmed, rejected, completed, cancelled
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

    
    __table_args__ = (
        CheckConstraint('end_date >= start_date', name='chk_dates'),
    )

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='chk_rating_range'),
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(TEXT, nullable=False)
    is_read = Column(BOOLEAN, default=False)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)