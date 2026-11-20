"""Idempotent demo account + activity seeding."""

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from . import ml_service
from .models import Prediction, User


def ensure_demo_user() -> User:
    user = User.objects.filter(email=settings.DEMO_EMAIL).first()
    if user is None:
        user = User.objects.create_user(
            email=settings.DEMO_EMAIL,
            password=settings.DEMO_PASSWORD,
            full_name=settings.DEMO_NAME,
        )
    return user


def seed_demo_activity(user: User | None = None) -> int:
    """Populate a realistic activity trail on first run. Returns rows created."""
    user = user or ensure_demo_user()
    if user.predictions.exists():
        return 0

    frame = ml_service.dataset()
    indices = set(range(0, len(frame), 300))
    anomalies = frame.index[frame.Anomaly_Label == 1][::18][:6].tolist()
    indices.update(anomalies)

    now = timezone.now()
    records = []
    for position, index in enumerate(sorted(indices)):
        row = frame.iloc[index]
        values = {
            "Electricity_Consumed": float(row.Electricity_Consumed),
            "Temperature": float(row.Temperature),
            "Humidity": float(row.Humidity),
            "Wind_Speed": float(row.Wind_Speed),
            "Avg_of_past12": float(row.Avg_of_past12),
        }
        result = ml_service.predict_one(values, threshold=0.5)
        records.append(
            Prediction(
                user=user,
                source="single",
                timestamp_value=row.Timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                electricity_consumed=values["Electricity_Consumed"],
                temperature=values["Temperature"],
                humidity=values["Humidity"],
                wind_speed=values["Wind_Speed"],
                avg_of_past12=values["Avg_of_past12"],
                threshold=0.5,
                probability=result["probability"],
                prediction=result["prediction"],
                risk_level=result["risk_level"],
                created_at=now - timedelta(hours=position * 3),
            )
        )
    Prediction.objects.bulk_create(records)
    return len(records)


def seed_demo() -> tuple[User, int]:
    user = ensure_demo_user()
    return user, seed_demo_activity(user)
