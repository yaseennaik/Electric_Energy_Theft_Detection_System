"""Django settings for the VoltGuard API."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Machine-learning artifacts (unchanged from the original notebook pipeline).
DATA_DIR = BASE_DIR / "Dataset"
MODEL_DIR = BASE_DIR / "Models"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

DATASET_PATH = DATA_DIR / "Processed_data.csv"
RAW_DATASET_PATH = DATA_DIR / "Raw_Data.csv"
MODEL_PATH = MODEL_DIR / "rf_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

SECRET_KEY = os.getenv(
    "VOLTGUARD_SECRET_KEY",
    "voltguard-dev-secret-key-change-me-in-production",
)
DEBUG = os.getenv("VOLTGUARD_DEBUG", "1") == "1"
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver", "[::1]"]


INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "voltguard.urls"
WSGI_APPLICATION = "voltguard.wsgi.application"
ASGI_APPLICATION = "voltguard.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.getenv("VOLTGUARD_DB_PATH", str(BASE_DIR / "db.sqlite3")),
    }
}

AUTH_USER_MODEL = "api.User"
AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = False  # keep naive UTC timestamps, matching the original API output

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# JWT / demo account settings (same contract as the previous FastAPI backend).
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
DEMO_EMAIL = "demo@voltguard.io"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo Analyst"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["api.auth.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}
