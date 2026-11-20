"""Database tables for users and stored predictions."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False, default="Energy Analyst")
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    predictions = relationship("Prediction", back_populates="owner", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    batch_id = Column(String(64), index=True, nullable=True)
    source = Column(String(16), default="single", nullable=False)

    timestamp_value = Column(String(64), nullable=True)
    electricity_consumed = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    avg_of_past12 = Column(Float, nullable=False)

    threshold = Column(Float, nullable=False)
    probability = Column(Float, nullable=False)
    prediction = Column(Integer, nullable=False)
    risk_level = Column(String(16), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    owner = relationship("User", back_populates="predictions")
