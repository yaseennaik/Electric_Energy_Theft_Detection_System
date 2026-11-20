"""Prediction, batch scoring, history and dashboard endpoints."""

import math
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import auth, ml_service, models, schemas
from ..database import get_db

router = APIRouter(tags=["Predictions"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_BATCH_ROWS = 2000


def _record_from_result(
    user_id: int,
    values: dict[str, float],
    result: dict,
    batch_id: Optional[str] = None,
    timestamp_value: Optional[str] = None,
) -> models.Prediction:
    return models.Prediction(
        user_id=user_id,
        batch_id=batch_id,
        source="batch" if batch_id else "single",
        timestamp_value=timestamp_value,
        electricity_consumed=values["Electricity_Consumed"],
        temperature=values["Temperature"],
        humidity=values["Humidity"],
        wind_speed=values["Wind_Speed"],
        avg_of_past12=values["Avg_of_past12"],
        threshold=result["threshold"],
        probability=result["probability"],
        prediction=result["prediction"],
        risk_level=result["risk_level"],
    )


def _to_output(record: models.Prediction, contributions=None) -> schemas.PredictionOut:
    output = schemas.PredictionOut.model_validate(record)
    if contributions:
        output.contributions = [schemas.Contribution(**item) for item in contributions]
    return output


@router.post("/predict", response_model=schemas.PredictionOut)
def predict(
    payload: schemas.PredictionIn,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    values = payload.model_dump()
    values["Avg_of_past12"] = (
        values.get("avg_of_past12")
        if values.get("avg_of_past12") is not None
        else values["electricity_consumed"]
    )
    result = ml_service.predict_one(values, payload.threshold)
    record = _record_from_result(
        current_user.id,
        result["values"],
        result,
        timestamp_value=payload.timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_output(record, result["contributions"])


@router.post("/predict/batch", response_model=schemas.BatchSummary)
async def predict_batch(
    file: UploadFile = File(..., description="CSV with meter readings"),
    threshold: float = Query(default=0.5, ge=0, le=1),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="CSV file must be smaller than 10 MB")

    try:
        frame = ml_service.read_csv_bytes(content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    if len(frame) > MAX_BATCH_ROWS:
        frame = frame.head(MAX_BATCH_ROWS)

    try:
        results = ml_service.predict_dataframe(frame, threshold)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    for row in results:
        values = {
            "Electricity_Consumed": row["electricity_consumed"],
            "Temperature": row["temperature"],
            "Humidity": row["humidity"],
            "Wind_Speed": row["wind_speed"],
            "Avg_of_past12": row["avg_of_past12"],
        }
        db.add(
            _record_from_result(
                current_user.id,
                values,
                {
                    "threshold": threshold,
                    "probability": row["probability"],
                    "prediction": row["prediction"],
                    "risk_level": row["risk_level"],
                },
                batch_id=batch_id,
                timestamp_value=row["timestamp"],
            )
        )
    db.commit()

    probabilities = [row["probability"] for row in results] or [0.0]
    flagged = sum(row["prediction"] for row in results)
    return schemas.BatchSummary(
        batch_id=batch_id,
        total_rows=len(frame),
        processed_rows=len(results),
        invalid_rows=len(frame) - len(results),
        normal_count=len(results) - flagged,
        flagged_count=flagged,
        critical_count=sum(row["risk_level"] == "critical" for row in results),
        average_probability=round(sum(probabilities) / len(probabilities), 4),
        flag_rate=round(flagged / len(results) * 100, 2) if results else 0.0,
        results=[schemas.BatchResultItem(**row) for row in results],
        errors=[]
        if len(results) == len(frame)
        else [f"{len(frame) - len(results)} row(s) had missing or non-numeric feature values."],
    )


@router.get("/history", response_model=schemas.HistoryPage)
def history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    prediction: Optional[int] = Query(default=None),
    risk: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id)
    if prediction is not None:
        query = query.filter(models.Prediction.prediction == prediction)
    if risk:
        query = query.filter(models.Prediction.risk_level == risk)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                func.coalesce(models.Prediction.batch_id, "").like(term),
                func.coalesce(models.Prediction.timestamp_value, "").like(term),
            )
        )

    total = query.count()
    pages = math.ceil(total / page_size) if total else 1
    records = (
        query.order_by(models.Prediction.created_at.desc(), models.Prediction.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.HistoryPage(
        items=[schemas.PredictionOut.model_validate(record) for record in records],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.delete("/history/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(
    prediction_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.Prediction)
        .filter(models.Prediction.id == prediction_id, models.Prediction.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(record)
    db.commit()


@router.get("/stats", response_model=schemas.DashboardStats)
def stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id)
    total = base.count()
    flagged = base.filter(models.Prediction.prediction == 1).count()
    avg_probability = db.query(func.avg(models.Prediction.probability)).filter(
        models.Prediction.user_id == current_user.id
    ).scalar()
    batches = db.query(func.count(func.distinct(models.Prediction.batch_id))).filter(
        models.Prediction.user_id == current_user.id,
        models.Prediction.batch_id.isnot(None),
    ).scalar()
    last = base.order_by(models.Prediction.created_at.desc()).first()
    recent = base.order_by(models.Prediction.created_at.desc()).limit(5).all()

    return schemas.DashboardStats(
        total_predictions=total,
        flagged_predictions=flagged,
        normal_predictions=total - flagged,
        flag_rate=round(flagged / total * 100, 1) if total else 0.0,
        average_probability=round(float(avg_probability), 4) if avg_probability else 0.0,
        batches_analyzed=int(batches or 0),
        last_prediction_at=last.created_at if last else None,
        recent=[schemas.PredictionOut.model_validate(record) for record in recent],
        model={
            "accuracy": ml_service.METRICS["accuracy"],
            "roc_auc": ml_service.METRICS["roc_auc"],
            "name": "Random Forest · 300 trees",
        },
    )
