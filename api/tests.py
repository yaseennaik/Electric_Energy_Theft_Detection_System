"""Smoke tests for the Django REST Framework API."""

import uuid

from rest_framework import status
from rest_framework.test import APITestCase

from .seed import seed_demo


class VoltGuardAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        seed_demo()

    def setUp(self):
        response = self.client.post("/api/auth/demo")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.token = response.data["access_token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_health(self):
        self.client.credentials()
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertEqual(len(response.data["features"]), 5)

    def test_model_info(self):
        response = self.client.get("/api/model/info")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["params"]["n_estimators"], 300)
        self.assertEqual(len(response.data["features"]), 5)

    def test_register_login_and_duplicate(self):
        self.client.credentials()
        email = f"test-{uuid.uuid4().hex[:8]}@voltguard.io"
        payload = {"email": email, "password": "secret123", "full_name": "Test Analyst"}

        created = self.client.post("/api/auth/register", payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["user"]["email"], email)

        duplicate = self.client.post("/api/auth/register", payload, format="json")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)

        login = self.client.post(
            "/api/auth/login",
            {"email": email, "password": "secret123"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertTrue(login.data["access_token"])

    def test_prediction_requires_auth(self):
        self.client.credentials()
        response = self.client.post(
            "/api/predict",
            {
                "electricity_consumed": 0.2,
                "temperature": 0.5,
                "humidity": 0.5,
                "wind_speed": 0.5,
                "avg_of_past12": 0.3,
            },
            format="json",
        )
        self.assertIn(response.status_code, (401, 403))

    def test_single_prediction_and_history(self):
        payload = {
            "electricity_consumed": 0.14,
            "temperature": 0.58,
            "humidity": 0.76,
            "wind_speed": 0.44,
            "avg_of_past12": 0.27,
            "threshold": 0.5,
        }
        response = self.client.post("/api/predict", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["probability"], 0)
        self.assertIn(response.data["prediction"], (0, 1))
        self.assertEqual(len(response.data["contributions"]), 5)

        history = self.client.get("/api/history")
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(history.data["total"], 1)
        self.assertTrue(any(item["id"] == response.data["id"] for item in history.data["items"]))

    def test_batch_prediction_autoderives_rolling_average(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        csv = (
            b"Timestamp,Electricity_Consumed,Temperature,Humidity,Wind_Speed\n"
            b"2024-01-01 00:00:00,0.45,0.47,0.40,0.44\n"
            b"2024-01-01 00:30:00,0.35,0.46,0.45,0.45\n"
            b"2024-01-01 01:00:00,0.14,0.58,0.76,0.43\n"
        )
        response = self.client.post(
            "/api/predict/batch",
            {"file": SimpleUploadedFile("readings.csv", csv, content_type="text/csv")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["processed_rows"], 3)
        self.assertEqual(response.data["invalid_rows"], 0)
        self.assertEqual(len(response.data["results"]), 3)
        self.assertGreater(response.data["results"][1]["avg_of_past12"], 0)
        self.assertTrue(response.data["batch_id"].startswith("BATCH-"))

    def test_analytics_endpoints(self):
        for path in (
            "/api/analytics/overview",
            "/api/analytics/timeseries",
            "/api/analytics/distributions",
            "/api/analytics/correlation",
            "/api/analytics/samples",
            "/api/stats",
        ):
            response = self.client.get(path)
            self.assertEqual(response.status_code, status.HTTP_200_OK, path)

        overview = self.client.get("/api/analytics/overview").data
        self.assertEqual(overview["total_readings"], 5000)
        self.assertEqual(overview["theft_readings"], 250)

    def test_spa_fallback(self):
        response = self.client.get("/app/predict")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
