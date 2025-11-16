# ⚡ Electric Energy Theft Detection System

## Overview
This repository contains a machine-learning pipeline to detect anomalous electricity consumption that may indicate power theft. The project combines processed consumption data with environmental features (temperature, humidity, wind speed) and uses resampling and ensemble modeling to handle class imbalance.

---

## Dataset (brief)
- Format: half-hourly readings
- Key features:
  - `Timestamp` (30-min intervals)
  - `Electricity_Consumed` (kWh)
  - `Temperature`, `Humidity`, **`Wind_Speed`******
  - `Avg_of_past12` (rolling mean of previous 12 readings)
  - `Anomaly_Label` (0 = Normal, 1 = Theft)

Processed dataset used for training: `Dataset/Processed_data.csv`.

---

## Preprocessing Summary
- Convert `Timestamp` to `datetime` and sort chronologically
- Compute `Avg_of_past12` (rolling mean)
- Drop irrelevant or duplicate columns
- Encode labels: Normal → `0`, Theft → `1`

---

## Modeling Pipeline (final)

- **Scaling:** Features are standardized with `StandardScaler` prior to resampling.
- **Resampling:** `SMOTE` is applied to create synthetic minority-class samples and balance the training set.
- **Train/Test split:** Resampled dataset is split (default `test_size=0.2`, `random_state=42`).
- **Model:** `RandomForestClassifier` with:
  - `n_estimators=300`
  - `class_weight='balanced'`
  - `max_depth=None`
  - `min_samples_split=2`
- **Prediction & Thresholding:** Model outputs probabilities (`predict_proba`). Default threshold is `0.5` to convert probabilities into binary labels; this is adjustable to trade precision vs recall (e.g., lowering to 0.3 increases recall at the expense of precision).
- **Artifacts saved:**
  - Model: `Models/rf_model.pkl`
  - Scaler: `Models/scaler.pkl`

Notes: Scaling before SMOTE typically yields better synthetic samples when using distance-based methods. Always validate resampling results via cross-validation or a held-out test set to avoid overfitting to synthetic patterns.

---

## Evaluation (example results)
The notebook contains an example evaluation using the final pipeline. Example confusion matrix and metrics obtained from a representative run (see `Notebooks/Model.ipynb` for reproducible code):

```
Confusion Matrix:
[[934  11]
 [ 28  27]]
```

- **Overall accuracy:** 0.96
- **Theft class (1):** Precision ~0.71, Recall ~0.49, F1 ~0.58

These numbers are from a single run; run the notebook to get current, reproducible metrics for your environment.

---

## How to reproduce

1. Create and activate a Python environment (suggested Python 3.9+)

```powershell
# from workspace root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run preprocessing and model notebook or script:

```powershell
# Open the notebook in Jupyter or run a script that trains the model
jupyter notebook Notebooks/Preprocessing.ipynb
jupyter notebook Notebooks/Model.ipynb
```

3. After training, the model and scaler are saved as `Models/rf_model.pkl` and `Models/scaler.pkl`.

---

## Streamlit demo
The `Streamlit/app.py` can be wired to load the saved artifacts for interactive inference. Key steps for the app:

- Load `Models/scaler.pkl` and `Models/rf_model.pkl` using `joblib`.
- Apply the scaler to incoming feature vectors, call `predict_proba`, and provide a threshold-based label.

---

## Contact / Author
Developed by **Yaseen Naik** — Energy-focused ML Research Project

