"""Dataset exploration endpoints used by the analytics pages."""

from fastapi import APIRouter, Depends, Query

from .. import auth, ml_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def overview(_user=Depends(auth.get_current_user)):
    return ml_service.overview()


@router.get("/timeseries")
def timeseries(limit: int = Query(default=200, ge=10, le=2000), _user=Depends(auth.get_current_user)):
    return ml_service.timeseries(limit)


@router.get("/distributions")
def distributions(_user=Depends(auth.get_current_user)):
    return ml_service.distributions()


@router.get("/correlation")
def correlation(_user=Depends(auth.get_current_user)):
    return ml_service.correlation()


@router.get("/samples")
def samples(_user=Depends(auth.get_current_user)):
    return ml_service.samples()
