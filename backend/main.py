"""VoltGuard — FastAPI application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import auth, ml_service, models
from .config import (
    API_DESCRIPTION,
    API_TITLE,
    API_VERSION,
    DEMO_EMAIL,
    DEMO_NAME,
    DEMO_PASSWORD,
    FRONTEND_DIST,
)
from .database import Base, SessionLocal, engine
from .routers import analytics, auth_router, predictions, system


# Create tables eagerly so the API also works when ASGI lifespan events are
# disabled (e.g. some test clients and serverless runtimes).
Base.metadata.create_all(bind=engine)


def _seed_demo_activity(db: Session, user: models.User) -> None:
    """Populate the demo account with a realistic activity trail on first run."""
    if db.query(models.Prediction).filter(models.Prediction.user_id == user.id).count():
        return

    frame = ml_service.dataset()
    indices = set(range(0, len(frame), 300))
    anomalies = frame.index[frame.Anomaly_Label == 1][::18][:6].tolist()
    indices.update(anomalies)

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
        db.add(
            models.Prediction(
                user_id=user.id,
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
                created_at=datetime.utcnow() - timedelta(hours=position * 3),
            )
        )
    db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db: Session = SessionLocal()
    try:
        demo_user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
        if not demo_user:
            demo_user = models.User(
                email=DEMO_EMAIL,
                full_name=DEMO_NAME,
                hashed_password=auth.hash_password(DEMO_PASSWORD),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        _seed_demo_activity(db, demo_user)
    finally:
        db.close()
    yield


app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


# --------------------------------------------------------------- frontend hosting
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
    """Serve the built React SPA, including client-side routes."""
    if not FRONTEND_DIST.exists():
        return HTMLResponse(
            "<h1>VoltGuard API is running</h1>"
            "<p>Build the frontend with <code>npm install &amp;&amp; npm run build</code> "
            "inside the <code>frontend</code> folder, or start the Vite dev server.</p>",
            status_code=200,
        )

    requested = (FRONTEND_DIST / full_path).resolve()
    root = FRONTEND_DIST.resolve()
    if requested.is_file() and root in requested.parents:
        return FileResponse(requested)
    return FileResponse(FRONTEND_DIST / "index.html")
