# ⚡ VoltGuard — Electric Energy Theft Detection System

An end-to-end, full-stack web application that turns a machine-learning research notebook into a deployable product. VoltGuard scores smart-meter readings for electricity theft, explains every prediction, and gives analysts a complete workspace for investigation.

> **Live locally:** `http://localhost:8000` · **Demo login:** `demo@voltguard.io` / `demo1234` (or click **Try live demo** on the landing page)

---

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite 6, React Router, Recharts, Lucide icons | Responsive SPA, landing page, dashboards and charts |
| Backend | **Django 5.2, Django REST Framework 3.16, django-cors-headers** | REST API, validation, ORM, persistence |
| Auth | **Custom JWT authentication (PyJWT) + Django PBKDF2-SHA256 hashing** | Stateless auth and per-user data isolation |
| ML serving | scikit-learn RandomForest, StandardScaler, joblib, pandas/numpy | Inference from the original trained artifacts |
| Tooling | Django test runner, Docker, PowerShell/Bash scripts | Tests, containerization and local startup |

The original FastAPI implementation is preserved in `backend/` as a reference; the running application is the Django/DRF version in `voltguard/` + `api/`.

---

## Quick start

### Option 1 — one command (Windows PowerShell)

```powershell
.\start.ps1
```

The script creates/reuses `.venv`, builds the React app if needed, runs `migrate` + `seed_demo`, then starts Django at **http://localhost:8000**.

If PowerShell blocks the script:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

### Option 2 — manual

```powershell
python -m venv --system-site-packages .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

Open **http://localhost:8000**. The built React app is served by Django; if `frontend/dist` does not exist, run `cd frontend; npm install; npm run build` first.

For frontend hot reload, run Django and Vite in two terminals:

```powershell
python manage.py runserver 127.0.0.1:8000   # terminal 1 → :8000
cd frontend; npm run dev                    # terminal 2 → :5173
```

CORS is configured for `:5173` and `:3000`, and the Vite proxy forwards `/api` to Django.

### Option 3 — Docker

```bash
docker compose up --build
# open http://localhost:8000
```

---

## Application tour

| Route | What it does |
|---|---|
| `/` | Public landing page — hero, live dashboard mockup, features, pipeline, model metrics, analytics preview, CTA |
| `/login`, `/register` | Authentication screens with one-click demo access |
| `/app` | Overview dashboard — KPIs, consumption stream with anomaly markers, risk donut, recent activity, quick actions |
| `/app/predict` | Single-reading scoring, threshold slider, animated probability gauge, feature influence chart, recommendations |
| `/app/batch` | Drag-and-drop CSV upload, summary metrics, row-level results table, export to CSV |
| `/app/history` | Searchable/filterable prediction history, detail modal, deletion, page export |
| `/app/analytics` | Dataset timeline, class balance, per-feature distributions, correlation heatmap, feature statistics |
| `/app/model` | Model card — metrics, confusion matrix, feature importance, pipeline, hyperparameters, caveats |
| `/app/settings` | Profile, session/security information and useful links |

---

## API reference

All endpoints are prefixed with `/api`. DRF's browsable API renderer is enabled — open an endpoint in the browser (e.g. `/api/health`) to inspect it.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Service health and loaded feature names |
| `GET` | `/api/model/info` | No | Metrics, parameters, feature importances and pipeline notes |
| `POST` | `/api/auth/register` | No | Create an account and receive a JWT |
| `POST` | `/api/auth/login` | No | Authenticate with email/password |
| `POST` | `/api/auth/demo` | No | One-click demo token |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `POST` | `/api/predict` | Yes | Score one reading and persist the result |
| `POST` | `/api/predict/batch` | Yes | Upload a CSV and score up to 2,000 rows |
| `GET` | `/api/history` | Yes | Paginated, filterable prediction history |
| `DELETE` | `/api/history/{id}` | Yes | Delete one of your predictions |
| `GET` | `/api/stats` | Yes | Dashboard aggregates and recent activity |
| `GET` | `/api/analytics/overview` | Yes | Dataset summary and feature statistics |
| `GET` | `/api/analytics/timeseries` | Yes | Sampled consumption timeline with labels |
| `GET` | `/api/analytics/distributions` | Yes | Histogram bins per feature and class |
| `GET` | `/api/analytics/correlation` | Yes | Pearson correlation matrix |
| `GET` | `/api/analytics/samples` | Yes | Example normal and theft readings |

Example single prediction:

```bash
curl -X POST http://localhost:8000/api/auth/demo
# copy access_token, then:
curl -X POST http://localhost:8000/api/predict \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"electricity_consumed":0.14,"temperature":0.58,"humidity":0.76,
       "wind_speed":0.44,"avg_of_past12":0.27,"threshold":0.5}'
```

Batch CSV accepted columns:

```csv
Timestamp,Electricity_Consumed,Temperature,Humidity,Wind_Speed
2024-01-01 00:00:00,0.4577,0.4695,0.3963,0.4454
```

`Avg_of_past12` is optional — the API derives a 12-reading rolling mean exactly as the preprocessing notebook does.

---

## Django ↔ FastAPI mapping

This project was ported from FastAPI to Django REST Framework. If you know one, here is where to find the equivalent in the other:

| FastAPI | Django / DRF | File here |
|---|---|---|
| `uvicorn backend.main:app` | `python manage.py runserver` | `manage.py` |
| `config.py` | `settings.py` | `voltguard/settings.py` |
| `main.py` (app + routes + SPA host) | project `urls.py` | `voltguard/urls.py` |
| `backend/routers/*.py` | `@api_view` functions | `api/views.py` |
| `backend/schemas.py` (Pydantic) | `api/serializers.py` (DRF) | `api/serializers.py` |
| `backend/models.py` (SQLAlchemy) | Django ORM models | `api/models.py` |
| `auth.py` HTTPBearer dependency | `JWTAuthentication` class | `api/auth.py` |
| `Depends(get_db)` | ORM queries via `Model.objects` | `api/views.py` |
| `lifespan` seeding | `manage.py seed_demo` command | `api/management/commands/seed_demo.py` |
| `/docs` Swagger | DRF browsable API | any `/api/...` endpoint in a browser |
| `pytest backend/tests` | `python manage.py test api` | `api/tests.py` |

The ML module was copied unchanged apart from reading paths from Django settings: `api/ml_service.py`.

---

## Machine learning pipeline

The original research pipeline is preserved; the app serves its saved artifacts (`Models/rf_model.pkl`, `Models/scaler.pkl`).

```
Raw half-hourly readings (5,000 rows, 5% abnormal)
  → drop redundant Avg_Past_Consumption
  → sort by timestamp, derive Avg_of_past12 (rolling window = 12)
  → encode Normal = 0, Abnormal = 1
  → StandardScaler on the five numeric features
  → SMOTE resampling (4,750 / 4,750)
  → train/test split (80/20, random_state = 42)
  → RandomForestClassifier(300 trees, class_weight='balanced')
  → predict_proba with tunable decision threshold (default 0.5)
```

**Reported held-out results (1,900 SMOTE-balanced samples):**

| Metric | Value |
|---|---|
| Accuracy | 96.9% |
| Precision (theft) | 95.4% |
| Recall (theft) | 98.4% |
| F1 (theft) | 96.9% |
| ROC-AUC | 99.7% |
| Confusion matrix | `[[923, 44], [15, 918]]` |

Feature importance: `Electricity_Consumed` 43.7%, `Avg_of_past12` 39.7%, `Temperature` 6.1%, `Wind_Speed` 5.7%, `Humidity` 4.8%.

**Honest caveats:** scaling and SMOTE were applied before the split in the original notebook, and metrics are measured on a class-balanced test set rather than the real 5% prevalence. A production retrain should fit preprocessing inside a cross-validated pipeline and validate on unresampled data.

The training notebooks remain in `Notebooks/`. `requirements-training.txt` preserves their original pinned environment.

---

## Project structure

```
Electric_Energy_Theft_Detection_System/
├── manage.py                  # Django CLI entry point
├── voltguard/                 # Django project: settings, root URLs, ASGI/WSGI
├── api/                       # Django app
│   ├── models.py              # User + Prediction ORM models
│   ├── serializers.py         # DRF request/response validation
│   ├── views.py               # All API endpoints
│   ├── urls.py                # /api/... routes
│   ├── auth.py                # JWT authentication class
│   ├── ml_service.py          # Model loading, inference, analytics
│   ├── seed.py                # Demo account/activity seeding helpers
│   ├── management/commands/seed_demo.py
│   └── tests.py               # API smoke tests
├── backend/                   # Legacy FastAPI implementation (reference only)
├── frontend/                  # React + Vite SPA (built into frontend/dist)
├── Dataset/                   # Raw and processed CSVs
├── Models/                    # Trained RandomForest + scaler
├── Notebooks/                 # Original preprocessing, training, EDA
├── Dockerfile / docker-compose.yml
├── requirements.txt           # Django + DRF runtime and test dependencies
├── requirements-fastapi.txt   # Legacy FastAPI dependencies
├── start.ps1 / start.sh
└── README.md
```

---

## Testing

```powershell
.\.venv\Scripts\python manage.py test api -v 2
# 8 passed
```

Tests cover health, model info, registration/login/duplicates, auth enforcement, single prediction persistence, batch scoring with auto-derived rolling averages, all analytics endpoints and the SPA fallback.

---

## Resume talking points

- Migrated a notebook-only ML prototype into a full-stack Django REST product with a landing page, authenticated workspace and persistent data layer.
- Built a DRF model-serving layer around pre-trained scikit-learn artifacts, including CSV batch inference and a tunable decision threshold.
- Implemented custom JWT authentication, PBKDF2 password hashing and per-user query isolation.
- Designed a React analytics dashboard with Recharts visualisations, explainable predictions and exportable reports.
- Documented model limitations honestly (pre-split SMOTE, balanced test set) instead of overstating accuracy.
