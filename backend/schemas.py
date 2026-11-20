"""Pydantic request and response models."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------- auth
class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(default="Energy Analyst", max_length=120)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------- prediction
class PredictionIn(BaseModel):
    electricity_consumed: float = Field(ge=0, le=1)
    temperature: float = Field(ge=0, le=1)
    humidity: float = Field(ge=0, le=1)
    wind_speed: float = Field(ge=0, le=1)
    avg_of_past12: Optional[float] = Field(default=None, ge=0, le=1)
    threshold: float = Field(default=0.5, ge=0, le=1)
    timestamp: Optional[str] = None


class Contribution(BaseModel):
    feature: str
    label: str
    value: float
    z_score: float
    importance: float
    share: float
    direction: str


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: Optional[str] = None
    source: str
    timestamp_value: Optional[str] = None
    electricity_consumed: float
    temperature: float
    humidity: float
    wind_speed: float
    avg_of_past12: float
    threshold: float
    probability: float
    prediction: int
    risk_level: str
    created_at: datetime
    contributions: List[Contribution] = Field(default_factory=list)


class BatchResultItem(BaseModel):
    row: int
    timestamp: Optional[str] = None
    electricity_consumed: float
    temperature: float
    humidity: float
    wind_speed: float
    avg_of_past12: float
    probability: float
    prediction: int
    risk_level: str


class BatchSummary(BaseModel):
    batch_id: str
    total_rows: int
    processed_rows: int
    invalid_rows: int
    normal_count: int
    flagged_count: int
    critical_count: int
    average_probability: float
    flag_rate: float
    results: List[BatchResultItem]
    errors: List[str] = Field(default_factory=list)


class HistoryPage(BaseModel):
    items: List[PredictionOut]
    total: int
    page: int
    page_size: int
    pages: int


class DashboardStats(BaseModel):
    total_predictions: int
    flagged_predictions: int
    normal_predictions: int
    flag_rate: float
    average_probability: float
    batches_analyzed: int
    last_prediction_at: Optional[datetime] = None
    recent: List[PredictionOut] = Field(default_factory=list)
    model: dict[str, Any] = Field(default_factory=dict)
