"""Model serving, inference helpers and dataset analytics.

The serialized RandomForest / StandardScaler artifacts produced by
``Notebooks/Model.ipynb`` are loaded once at import time and reused for every
request.  All feature names and preprocessing steps match the training
notebook exactly.
"""

from __future__ import annotations

import io
import warnings
from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
from joblib import load
from sklearn.exceptions import InconsistentVersionWarning

from django.conf import settings

DATASET_PATH = settings.DATASET_PATH
MODEL_PATH = settings.MODEL_PATH
SCALER_PATH = settings.SCALER_PATH

with warnings.catch_warnings():
    warnings.simplefilter("ignore", InconsistentVersionWarning)
    warnings.simplefilter("ignore", FutureWarning)
    MODEL = load(MODEL_PATH)
    SCALER = load(SCALER_PATH)

FEATURES: list[str] = list(SCALER.feature_names_in_)
MEANS = dict(zip(FEATURES, SCALER.mean_.tolist()))
SCALES = dict(zip(FEATURES, SCALER.scale_.tolist()))
IMPORTANCES = dict(zip(FEATURES, MODEL.feature_importances_.tolist()))

FEATURE_LABELS = {
    "Electricity_Consumed": "Electricity consumed",
    "Temperature": "Temperature",
    "Humidity": "Humidity",
    "Wind_Speed": "Wind speed",
    "Avg_of_past12": "12-reading average",
}

# Verified held-out metrics from the training notebook (SMOTE-balanced split).
METRICS: dict[str, Any] = {
    "accuracy": 0.9689,
    "roc_auc": 0.9967,
    "precision": 0.9543,
    "recall": 0.9839,
    "f1": 0.9689,
    "normal": {"precision": 0.9840, "recall": 0.9545, "f1": 0.9690, "support": 967},
    "theft": {"precision": 0.9543, "recall": 0.9839, "f1": 0.9689, "support": 933},
    "confusion_matrix": [[923, 44], [15, 918]],
    "test_samples": 1900,
    "train_samples": 7600,
    "resampled_samples": 9500,
    "threshold": 0.5,
}

MODEL_PARAMS: dict[str, Any] = {
    "algorithm": "Random Forest Classifier",
    "n_estimators": MODEL.n_estimators,
    "criterion": MODEL.criterion,
    "max_depth": "None (unlimited)",
    "min_samples_split": MODEL.min_samples_split,
    "max_features": MODEL.max_features,
    "class_weight": "balanced",
    "random_state": MODEL.random_state,
    "bootstrap": MODEL.bootstrap,
}


# --------------------------------------------------------------------------- core
def risk_level(probability: float, threshold: float = 0.5) -> str:
    if probability >= 0.85:
        return "critical"
    if probability >= 0.65:
        return "high"
    if probability >= threshold:
        return "elevated"
    return "normal"


def _build_values(payload: dict[str, float]) -> dict[str, float]:
    values: dict[str, float] = {}
    for feature in FEATURES:
        value = payload.get(feature, payload.get(feature.lower()))
        if value is None:
            raise ValueError(f"Missing required feature: {feature}")
        values[feature] = float(value)
    return values


def _contributions(values: dict[str, float]) -> list[dict[str, Any]]:
    """Heuristic per-feature explanation using z-scores x model importance."""
    raw = []
    for feature in FEATURES:
        z = (values[feature] - MEANS[feature]) / SCALES[feature]
        influence = z * IMPORTANCES[feature]
        raw.append(
            {
                "feature": feature,
                "label": FEATURE_LABELS[feature],
                "value": round(values[feature], 6),
                "z_score": round(float(z), 3),
                "importance": round(IMPORTANCES[feature], 4),
                "_influence": float(influence),
            }
        )
    total = sum(abs(item["_influence"]) for item in raw) or 1.0
    for item in raw:
        item["share"] = round(abs(item["_influence"]) / total * 100, 1)
        item["direction"] = "increases" if item["_influence"] >= 0 else "decreases"
        item.pop("_influence")
    return sorted(raw, key=lambda item: item["share"], reverse=True)


def predict_one(payload: dict[str, Any], threshold: float = 0.5) -> dict[str, Any]:
    """Score a single observation and return probability + explanation."""
    values = _build_values(payload)
    frame = pd.DataFrame([[values[f] for f in FEATURES]], columns=FEATURES)
    scaled = SCALER.transform(frame)
    probability = float(MODEL.predict_proba(scaled)[0][1])
    prediction = int(probability >= threshold)
    return {
        "values": values,
        "probability": probability,
        "prediction": prediction,
        "risk_level": risk_level(probability, threshold),
        "threshold": threshold,
        "contributions": _contributions(values),
    }


def predict_dataframe(frame: pd.DataFrame, threshold: float = 0.5) -> list[dict[str, Any]]:
    """Score a DataFrame of readings (used by the batch endpoint)."""
    normalized = frame.rename(columns={c.lower().replace(" ", "_"): c for c in frame.columns})
    column_map = {c.lower().replace("_", ""): c for c in FEATURES}
    mapped: dict[str, str] = {}
    for col in normalized.columns:
        key = col.lower().replace("_", "")
        if key in column_map:
            mapped[column_map[key]] = col
        elif key in {"avgpastconsumption", "avgpast12", "averagepastconsumption"}:
            mapped["Avg_of_past12"] = col

    missing = [f for f in FEATURES if f not in mapped]
    if "Electricity_Consumed" in missing:
        raise ValueError(
            "CSV must contain an 'Electricity_Consumed' column (plus Temperature, "
            "Humidity and Wind_Speed)."
        )

    data = pd.DataFrame(index=frame.index)
    for feature in FEATURES:
        if feature in mapped:
            data[feature] = pd.to_numeric(normalized[mapped[feature]], errors="coerce")
        elif feature == "Avg_of_past12":
            data[feature] = data["Electricity_Consumed"].rolling(window=12, min_periods=1).mean()
        else:
            data[feature] = np.nan

    valid_mask = data.notna().all(axis=1)
    valid = data[valid_mask]
    if valid.empty:
        return []

    scaled = SCALER.transform(valid[FEATURES])
    probabilities = MODEL.predict_proba(scaled)[:, 1]

    timestamp_col = next(
        (c for c in normalized.columns if c.lower() in {"timestamp", "time", "datetime"}),
        None,
    )
    results = []
    for position, (index, probability) in enumerate(zip(valid.index, probabilities)):
        prob = float(probability)
        row = {
            "row": int(index) + 2,  # 1-based row number including CSV header
            "timestamp": str(normalized.at[index, timestamp_col]) if timestamp_col else None,
            "electricity_consumed": float(valid.at[index, "Electricity_Consumed"]),
            "temperature": float(valid.at[index, "Temperature"]),
            "humidity": float(valid.at[index, "Humidity"]),
            "wind_speed": float(valid.at[index, "Wind_Speed"]),
            "avg_of_past12": float(valid.at[index, "Avg_of_past12"]),
            "probability": prob,
            "prediction": int(prob >= threshold),
            "risk_level": risk_level(prob, threshold),
        }
        results.append(row)
    return results


# ---------------------------------------------------------------------- analytics
@lru_cache(maxsize=1)
def dataset() -> pd.DataFrame:
    frame = pd.read_csv(DATASET_PATH)
    frame["Timestamp"] = pd.to_datetime(frame["Timestamp"])
    return frame.sort_values("Timestamp").reset_index(drop=True)


def overview() -> dict[str, Any]:
    frame = dataset()
    total = len(frame)
    theft = int(frame["Anomaly_Label"].sum())
    return {
        "total_readings": total,
        "normal_readings": total - theft,
        "theft_readings": theft,
        "theft_rate": round(theft / total * 100, 2),
        "start_date": frame["Timestamp"].min().strftime("%Y-%m-%d"),
        "end_date": frame["Timestamp"].max().strftime("%Y-%m-%d"),
        "interval_minutes": 30,
        "feature_summary": [
            {
                "feature": f,
                "label": FEATURE_LABELS[f],
                "mean": round(float(frame[f].mean()), 4),
                "std": round(float(frame[f].std()), 4),
                "min": round(float(frame[f].min()), 4),
                "max": round(float(frame[f].max()), 4),
            }
            for f in FEATURES
        ],
    }


def timeseries(limit: int = 200) -> list[dict[str, Any]]:
    frame = dataset()
    step = max(1, len(frame) // limit)
    sample = frame.iloc[::step]
    return [
        {
            "timestamp": row.Timestamp.strftime("%Y-%m-%d %H:%M"),
            "electricity_consumed": round(float(row.Electricity_Consumed), 4),
            "avg_of_past12": round(float(row.Avg_of_past12), 4),
            "temperature": round(float(row.Temperature), 4),
            "label": int(row.Anomaly_Label),
        }
        for row in sample.itertuples(index=False)
    ]


def distributions() -> list[dict[str, Any]]:
    frame = dataset()
    bins = np.linspace(0, 1, 11)
    output = []
    for feature in FEATURES:
        normal_counts, _ = np.histogram(frame.loc[frame.Anomaly_Label == 0, feature], bins=bins)
        theft_counts, _ = np.histogram(frame.loc[frame.Anomaly_Label == 1, feature], bins=bins)
        output.append(
            {
                "feature": feature,
                "label": FEATURE_LABELS[feature],
                "bins": [
                    {
                        "range": f"{bins[i]:.1f}-{bins[i + 1]:.1f}",
                        "normal": int(normal_counts[i]),
                        "theft": int(theft_counts[i]),
                    }
                    for i in range(len(bins) - 1)
                ],
            }
        )
    return output


def correlation() -> dict[str, Any]:
    matrix = dataset()[FEATURES].corr().round(3)
    return {
        "labels": [FEATURE_LABELS[f] for f in FEATURES],
        "matrix": matrix.values.tolist(),
    }


def model_info() -> dict[str, Any]:
    return {
        "name": "VoltGuard Random Forest v1.0",
        "task": "Binary anomaly detection (0 = Normal, 1 = Theft/Abnormal)",
        "params": MODEL_PARAMS,
        "metrics": METRICS,
        "features": [
            {
                "feature": f,
                "label": FEATURE_LABELS[f],
                "importance": round(IMPORTANCES[f], 4),
            }
            for f in sorted(FEATURES, key=lambda name: IMPORTANCES[name], reverse=True)
        ],
        "pipeline": [
            "Load half-hourly smart-meter readings",
            "Derive 12-reading rolling consumption average",
            "Encode labels (Normal -> 0, Abnormal -> 1)",
            "Standardize all five numeric features",
            "Apply SMOTE to balance the 5% minority class",
            "Train a class-weighted 300-tree Random Forest",
            "Score with predict_proba and a tunable threshold",
        ],
        "notes": [
            "Metrics are reported on the SMOTE-balanced held-out test set (1,900 rows).",
            "Real-world precision will be lower than reported because actual theft prevalence is ~5%.",
            "Scaling and SMOTE were applied before splitting in the original notebook; a production retrain should fit them inside a cross-validated pipeline.",
        ],
    }


def samples() -> dict[str, Any]:
    frame = dataset()
    normal = frame[frame.Anomaly_Label == 0].iloc[4]
    theft = frame[frame.Anomaly_Label == 1].iloc[4]
    return {"normal": _sample_payload(normal), "theft": _sample_payload(theft)}


def _sample_payload(row: pd.Series) -> dict[str, Any]:
    return {
        "timestamp": row.Timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "electricity_consumed": round(float(row.Electricity_Consumed), 4),
        "temperature": round(float(row.Temperature), 4),
        "humidity": round(float(row.Humidity), 4),
        "wind_speed": round(float(row.Wind_Speed), 4),
        "avg_of_past12": round(float(row.Avg_of_past12), 4),
    }


def read_csv_bytes(content: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(content))
