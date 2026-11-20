"""JWT authentication for DRF — the DRF equivalent of FastAPI's HTTPBearer dependency."""

from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": email, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed("Invalid or expired token") from exc
    email = payload.get("sub")
    if not email:
        raise AuthenticationFailed("Invalid or expired token")
    return email


class JWTAuthentication(BaseAuthentication):
    """Read ``Authorization: Bearer <token>`` and resolve the owning user."""

    keyword = "Bearer"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "").split()
        if not header:
            return None
        if header[0].lower() != self.keyword.lower():
            return None
        if len(header) != 2:
            raise AuthenticationFailed("Invalid authorization header")

        from .models import User  # avoid an app-loading cycle

        email = decode_access_token(header[1])
        user = User.objects.filter(email=email, is_active=True).first()
        if user is None:
            raise AuthenticationFailed("User not found or inactive")
        return (user, header[1])

    def authenticate_header(self, request):
        return self.keyword
