"""Smoke tests for the VoltGuard API."""

import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def auth_headers(client):
    response = client.post("/api/auth/demo")
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert len(response.json()["features"]) == 5


def test_model_info(client):
    response = client.get("/api/model/info")
    assert response.status_code == 200
    body = response.json()
    assert body["params"]["n_estimators"] == 300
    assert len(body["features"]) == 5
    assert body["metrics"]["accuracy"] > 0.9


def test_register_login_and_duplicate(client):
    email = f"test-{uuid.uuid4().hex[:8]}@voltguard.io"
    payload = {"email": email, "password": "secret123", "full_name": "Test Analyst"}
    created = client.post("/api/auth/register", json=payload)
    assert created.status_code == 201
    assert created.json()["user"]["email"] == email

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 400

    login = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_prediction_requires_auth(client):
    response = client.post(
        "/api/predict",
        json={
            "electricity_consumed": 0.2,
            "temperature": 0.5,
            "humidity": 0.5,
            "wind_speed": 0.5,
            "avg_of_past12": 0.3,
        },
    )
    assert response.status_code in (401, 403)


def test_single_prediction_and_history(client, auth_headers):
    payload = {
        "electricity_consumed": 0.14,
        "temperature": 0.58,
        "humidity": 0.76,
        "wind_speed": 0.44,
        "avg_of_past12": 0.27,
        "threshold": 0.5,
    }
    response = client.post("/api/predict", json=payload, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["probability"] <= 1
    assert body["prediction"] in (0, 1)
    assert len(body["contributions"]) == 5
    assert body["risk_level"] in {"normal", "elevated", "high", "critical"}

    history = client.get("/api/history", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()["total"] >= 1
    assert any(item["id"] == body["id"] for item in history.json()["items"])


def test_batch_prediction_autoderives_rolling_average(client, auth_headers):
    csv = (
        "Timestamp,Electricity_Consumed,Temperature,Humidity,Wind_Speed\n"
        "2024-01-01 00:00:00,0.45,0.47,0.40,0.44\n"
        "2024-01-01 00:30:00,0.35,0.46,0.45,0.45\n"
        "2024-01-01 01:00:00,0.14,0.58,0.76,0.43\n"
    )
    response = client.post(
        "/api/predict/batch",
        files={"file": ("readings.csv", csv.encode(), "text/csv")},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["processed_rows"] == 3
    assert body["invalid_rows"] == 0
    assert len(body["results"]) == 3
    assert body["results"][1]["avg_of_past12"] > 0
    assert body["batch_id"].startswith("BATCH-")


def test_analytics_endpoints(client, auth_headers):
    for path in ("/api/analytics/overview", "/api/analytics/timeseries", "/api/analytics/distributions", "/api/analytics/correlation", "/api/analytics/samples", "/api/stats"):
        response = client.get(path, headers=auth_headers)
        assert response.status_code == 200, path

    overview = client.get("/api/analytics/overview", headers=auth_headers).json()
    assert overview["total_readings"] == 5000
    assert overview["theft_readings"] == 250
