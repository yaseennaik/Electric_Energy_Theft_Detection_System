"""Public health and model-information endpoints."""

from fastapi import APIRouter

from .. import ml_service

router = APIRouter(tags=["System"])


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "VoltGuard API",
        "model_loaded": True,
        "features": ml_service.FEATURES,
    }


@router.get("/model/info")
def model_info():
    return ml_service.model_info()
