# ⚡ VoltGuard — Electric Energy Theft Detection System

An end-to-end, full-stack web application that turns a machine-learning research notebook into a deployable product. VoltGuard scores smart-meter readings for electricity theft, explains every prediction, and gives analysts a complete workspace for investigation.

> **Live locally:** `http://localhost:8000` · **API docs:** `http://localhost:8000/docs`
> **Demo login:** `demo@voltguard.io` / `demo1234` (or click **Try live demo** on the landing page)

---

## What this project demonstrates

This repository started as a 9-file ML experiment (dataset, notebooks, pickled model and a minimal Streamlit form). It is now a production-style application with:

- A polished **marketing landing page** with hero dashboard mockup, feature sections, model performance evidence and CTAs
- **JWT authentication** with PBKDF2-SHA256 password hashing, registration, demo access and per-user data isolation
- A **FastAPI REST backend** that serves the original scikit-learn artifacts without retraining
- A **React + Vite single-page app** with seven authenticated workspace pages
- **Single-reading prediction** with tunable threshold and feature-level explainability
- **Batch CSV analysis** with automatic rolling-average derivation, validation and CSV export
- **SQLite persistence** for prediction history, filters, detail views and deletion
- **Dataset analytics** with interactive charts, distributions, correlations and feature statistics
- A **model card** documenting metrics, hyperparameters, training pipeline and methodological caveats
- Automated **API tests**, Docker packaging and one-command start scripts

---

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite 6, React Router, Recharts, Lucide icons | Responsive SPA, landing page, dashboards and charts |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2, SQLite | REST API, validation, auth, persistence |
| ML serving | scikit-learn RandomForest, StandardScaler, joblib, pandas/numpy | Inference from the original trained artifacts |
| Security | JWT (PyJWT), PBKDF2-SHA256, CORS | Stateless auth and protected endpoints |
| Tooling | pytest, httpx, Docker, PowerShell/Bash scripts | Tests, containerization and local startup |

---

## Quick start

### Option 1 — one command (Windows)

```powershell
.\start.ps1
```

The script creates a virtual environment (reusing installed ML packages), installs Python dependencies, builds the React app if needed, and starts the server at **http://localhost:8000**.

### Option 2 — manual

```powershell
# 1. Python environment
python -m venv --system-site-packages .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Frontend
cd frontend
npm install
npm run build
cd ..

# 3. Serve everything from FastAPI
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

For frontend development with hot reload, run the API and Vite separately:

```powershell
python -m uvicorn backend.main:app --reload          # terminal 1 → :8000
cd frontend; npm run dev                              # terminal 2 → :5173
```

Vite proxies `/api` to port 8000, so both setups use the same backend.

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

All endpoints are prefixed with `/api`. Interactive Swagger UI is available at `/docs`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Service health and loaded feature names |
| `GET` | `/model/info` | No | Metrics, parameters, feature importances and pipeline notes |
| `POST` | `/auth/register` | No | Create an account and receive a JWT |
| `POST` | `/auth/login` | No | Authenticate with email/password |
| `POST` | `/auth/demo` | No | One-click demo token |
| `GET` | `/auth/me` | Yes | Current user profile |
| `POST` | `/predict` | Yes | Score one reading and persist the result |
| `POST` | `/predict/batch` | Yes | Upload a CSV and score up to 2,000 rows |
| `GET` | `/history` | Yes | Paginated, filterable prediction history |
| `DELETE` | `/history/{id}` | Yes | Delete one of your predictions |
| `GET` | `/stats` | Yes | Dashboard aggregates and recent activity |
| `GET` | `/analytics/overview` | Yes | Dataset summary and feature statistics |
| `GET` | `/analytics/timeseries` | Yes | Sampled consumption timeline with labels |
| `GET` | `/analytics/distributions` | Yes | Histogram bins per feature and class |
| `GET` | `/analytics/correlation` | Yes | Pearson correlation matrix |
| `GET` | `/analytics/samples` | Yes | Example normal and theft readings |

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

`Avg_of_past12` is optional — when omitted, the API derives a 12-reading rolling mean exactly as the preprocessing notebook does.

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

**Honest caveats (documented in the app's model card):** scaling and SMOTE were applied before the split in the original notebook, and metrics are measured on a class-balanced test set rather than the real 5% prevalence. A production retrain should fit preprocessing inside a cross-validated pipeline and validate on unresampled data.

The training notebooks remain in `Notebooks/` for transparency. `requirements-training.txt` preserves their original pinned environment.

---

## Project structure

```
Electric_Energy_Theft_Detection_System/
├── backend/
│   ├── main.py                 # FastAPI app, lifespan, SPA hosting
│   ├── config.py               # Paths, secret key, demo credentials
│   ├── database.py             # SQLAlchemy engine/session
│   ├── models.py               # User and Prediction tables
│   ├── schemas.py              # Pydantic request/response models
│   ├── auth.py                 # Hashing and JWT dependencies
│   ├── ml_service.py           # Model loading, inference, analytics
│   ├── routers/                # auth, predictions, analytics, system
│   └── tests/test_api.py       # 7 API smoke tests
├── frontend/
│   ├── src/pages/              # Landing, auth and 7 workspace pages
│   ├── src/components/         # Layout, navbar, footer, shared UI
│   ├── src/context/            # Auth provider
│   ├── src/lib/                # API client and utilities
│   └── dist/                   # Production build served by FastAPI
├── Dataset/                    # Raw and processed CSVs
├── Models/                     # Trained RandomForest + scaler
├── Notebooks/                  # Original preprocessing, training, EDA
├── Dockerfile / docker-compose.yml
├── requirements.txt            # Runtime + test dependencies
├── requirements-training.txt   # Original notebook dependencies
├── start.ps1 / start.sh
└── README.md
```

---

## Testing

```bash
.\.venv\Scripts\python -m pytest backend/tests -q
# 7 passed
```

Tests cover health, model info, registration/login/duplicates, auth enforcement, single prediction persistence, batch scoring with auto-derived rolling averages and all analytics endpoints.

---

## Resume talking points

- Migrated a notebook-only ML prototype into a **full-stack product** with a landing page, authenticated workspace and persistent data layer.
- Built a **FastAPI model-serving layer** around pre-trained scikit-learn artifacts, including CSV batch inference and a tunable decision threshold.
- Implemented **JWT auth**, PBKDF2 password hashing and per-user prediction isolation.
- Designed a **React analytics dashboard** with Recharts visualisations, explainable predictions and exportable reports.
- Documented **model limitations** honestly (pre-split SMOTE, balanced test set) instead of overstating accuracy.

---

## Future improvements

- Move to PostgreSQL and add role-based access control for production deployments
- Retrain with SMOTE inside an sklearn `Pipeline` and select the threshold via cross-validated cost analysis
- Add background workers (Celery/Redis) for very large batch jobs
- Add alerting (email/webhooks) and meter-level dashboards for utility operators

---

**Author:** Yaseen Naik · [Source repository](https://github.com/yaseennaik/Electric_Energy_Theft_Detection_System)
