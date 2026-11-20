"""API views — DRF replacement for backend/routers/* in the FastAPI version."""

import math
import uuid

from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import ml_service
from .auth import create_access_token
from .models import Prediction, User
from .seed import ensure_demo_user, seed_demo_activity
from .serializers import (
    BatchUploadSerializer,
    HistoryQuerySerializer,
    PredictionInSerializer,
    PredictionOutSerializer,
    TimeseriesQuerySerializer,
    UserCreateSerializer,
    UserLoginSerializer,
    UserOutSerializer,
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_BATCH_ROWS = 2000


def _token_response(user: User, code: int = status.HTTP_200_OK) -> Response:
    return Response(
        {
            "access_token": create_access_token(user.email),
            "token_type": "bearer",
            "user": UserOutSerializer(user).data,
        },
        status=code,
    )


# ------------------------------------------------------------------- system
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response(
        {
            "status": "healthy",
            "service": "VoltGuard API",
            "model_loaded": True,
            "features": ml_service.FEATURES,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def model_info(request):
    return Response(ml_service.model_info())


# --------------------------------------------------------------------- auth
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()
    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "An account with this email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = User.objects.create_user(
        email=email,
        password=serializer.validated_data["password"],
        full_name=serializer.validated_data["full_name"].strip() or "Energy Analyst",
    )
    return _token_response(user, status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()
    user = User.objects.filter(email=email).first()
    if user is None or not user.check_password(serializer.validated_data["password"]):
        return Response(
            {"detail": "Incorrect email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return _token_response(user)


@api_view(["POST"])
@permission_classes([AllowAny])
def demo_login(request):
    user = ensure_demo_user()
    seed_demo_activity(user)
    return _token_response(user)


@api_view(["GET"])
def me(request):
    return Response(UserOutSerializer(request.user).data)


# --------------------------------------------------------------- predictions
def _prediction_values(data: dict) -> dict:
    return {
        "Electricity_Consumed": data["electricity_consumed"],
        "Temperature": data["temperature"],
        "Humidity": data["humidity"],
        "Wind_Speed": data["wind_speed"],
        "Avg_of_past12": (
            data["avg_of_past12"]
            if data["avg_of_past12"] is not None
            else data["electricity_consumed"]
        ),
    }


def _record_from_result(user, values, result, batch_id=None, timestamp_value=None) -> Prediction:
    return Prediction(
        user=user,
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


@api_view(["POST"])
def predict(request):
    serializer = PredictionInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = ml_service.predict_one(_prediction_values(data), data["threshold"])
    values = result["values"]
    record = _record_from_result(
        request.user,
        values,
        result,
        timestamp_value=data["timestamp"],
    )
    record.save()

    payload = PredictionOutSerializer(record).data
    payload["contributions"] = result["contributions"]
    return Response(payload)


@api_view(["POST"])
def predict_batch(request):
    upload_data = {"file": request.FILES.get("file")}
    if "threshold" in request.query_params:
        upload_data["threshold"] = request.query_params["threshold"]
    upload_serializer = BatchUploadSerializer(data=upload_data)
    upload_serializer.is_valid(raise_exception=True)
    uploaded = upload_serializer.validated_data["file"]
    threshold = upload_serializer.validated_data["threshold"]

    content = uploaded.read()
    if not content:
        return Response(
            {"detail": "The uploaded file is empty"}, status=status.HTTP_400_BAD_REQUEST
        )
    if len(content) > MAX_UPLOAD_BYTES:
        return Response(
            {"detail": "CSV file must be smaller than 10 MB"},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    try:
        frame = ml_service.read_csv_bytes(content)
    except Exception as exc:
        return Response(
            {"detail": f"Could not parse CSV: {exc}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(frame) > MAX_BATCH_ROWS:
        frame = frame.head(MAX_BATCH_ROWS)

    try:
        results = ml_service.predict_dataframe(frame, threshold)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    records = []
    for row in results:
        values = {
            "Electricity_Consumed": row["electricity_consumed"],
            "Temperature": row["temperature"],
            "Humidity": row["humidity"],
            "Wind_Speed": row["wind_speed"],
            "Avg_of_past12": row["avg_of_past12"],
        }
        records.append(
            _record_from_result(
                request.user,
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
    Prediction.objects.bulk_create(records)

    probabilities = [row["probability"] for row in results] or [0.0]
    flagged = sum(row["prediction"] for row in results)
    return Response(
        {
            "batch_id": batch_id,
            "total_rows": len(frame),
            "processed_rows": len(results),
            "invalid_rows": len(frame) - len(results),
            "normal_count": len(results) - flagged,
            "flagged_count": flagged,
            "critical_count": sum(row["risk_level"] == "critical" for row in results),
            "average_probability": round(sum(probabilities) / len(probabilities), 4),
            "flag_rate": round(flagged / len(results) * 100, 2) if results else 0.0,
            "results": results,
            "errors": []
            if len(results) == len(frame)
            else [
                f"{len(frame) - len(results)} row(s) had missing or non-numeric feature values."
            ],
        }
    )


@api_view(["GET"])
def history(request):
    query = HistoryQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    params = query.validated_data

    queryset = Prediction.objects.filter(user=request.user)
    if params["prediction"] is not None:
        queryset = queryset.filter(prediction=params["prediction"])
    if params["risk"]:
        queryset = queryset.filter(risk_level=params["risk"])
    if params["search"]:
        term = params["search"].strip()
        queryset = queryset.filter(
            Q(batch_id__icontains=term) | Q(timestamp_value__icontains=term)
        )

    total = queryset.count()
    page_size = params["page_size"]
    start = (params["page"] - 1) * page_size
    records = list(queryset[start : start + page_size])

    return Response(
        {
            "items": PredictionOutSerializer(records, many=True).data,
            "total": total,
            "page": params["page"],
            "page_size": page_size,
            "pages": math.ceil(total / page_size) if total else 1,
        }
    )


@api_view(["DELETE"])
def delete_prediction(request, prediction_id: int):
    record = Prediction.objects.filter(id=prediction_id, user=request.user).first()
    if record is None:
        return Response(
            {"detail": "Prediction not found"}, status=status.HTTP_404_NOT_FOUND
        )
    record.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def stats(request):
    base = Prediction.objects.filter(user=request.user)
    aggregates = base.aggregate(
        total=Count("id"),
        flagged=Count("id", filter=Q(prediction=1)),
        average_probability=Avg("probability"),
        batches=Count("batch_id", distinct=True),
    )
    total = aggregates["total"]
    flagged = aggregates["flagged"]
    recent = list(base.order_by("-created_at", "-id")[:5])
    last = recent[0] if recent else None

    return Response(
        {
            "total_predictions": total,
            "flagged_predictions": flagged,
            "normal_predictions": total - flagged,
            "flag_rate": round(flagged / total * 100, 1) if total else 0.0,
            "average_probability": round(float(aggregates["average_probability"]), 4)
            if aggregates["average_probability"] is not None
            else 0.0,
            "batches_analyzed": int(aggregates["batches"] or 0),
            "last_prediction_at": last.created_at if last else None,
            "recent": PredictionOutSerializer(recent, many=True).data,
            "model": {
                "accuracy": ml_service.METRICS["accuracy"],
                "roc_auc": ml_service.METRICS["roc_auc"],
                "name": "Random Forest · 300 trees",
            },
        }
    )


# ----------------------------------------------------------------- analytics
@api_view(["GET"])
def analytics_overview(request):
    return Response(ml_service.overview())


@api_view(["GET"])
def analytics_timeseries(request):
    query = TimeseriesQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    return Response(ml_service.timeseries(query.validated_data["limit"]))


@api_view(["GET"])
def analytics_distributions(request):
    return Response(ml_service.distributions())


@api_view(["GET"])
def analytics_correlation(request):
    return Response(ml_service.correlation())


@api_view(["GET"])
def analytics_samples(request):
    return Response(ml_service.samples())
