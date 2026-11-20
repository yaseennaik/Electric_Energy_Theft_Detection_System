"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..config import DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _token_response(user: models.User) -> schemas.Token:
    return schemas.Token(
        access_token=auth.create_access_token(user.email),
        user=schemas.UserOut.model_validate(user),
    )


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.User(
        email=email,
        full_name=payload.full_name.strip() or "Energy Analyst",
        hashed_password=auth.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return _token_response(user)


@router.post("/demo", response_model=schemas.Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click demo access for recruiters and portfolio visitors."""
    user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
    if not user:
        user = models.User(
            email=DEMO_EMAIL,
            full_name=DEMO_NAME,
            hashed_password=auth.hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return _token_response(user)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
