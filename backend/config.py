"""Central configuration for the VoltGuard backend."""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset"
MODEL_DIR = BASE_DIR / "Models"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

DATASET_PATH = DATA_DIR / "Processed_data.csv"
RAW_DATASET_PATH = DATA_DIR / "Raw_Data.csv"
MODEL_PATH = MODEL_DIR / "rf_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

DB_PATH = Path(
    os.getenv("VOLTGUARD_DB_PATH", str(BASE_DIR / "backend" / "voltguard.db"))
)

SECRET_KEY = os.getenv(
    "VOLTGUARD_SECRET_KEY",
    "voltguard-dev-secret-key-change-me-in-production",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

DEMO_EMAIL = "demo@voltguard.io"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo Analyst"

API_TITLE = "VoltGuard API"
API_DESCRIPTION = "Energy theft detection — model serving, analytics and prediction history."
API_VERSION = "1.0.0"
