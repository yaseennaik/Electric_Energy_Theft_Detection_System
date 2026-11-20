"""URL routes for the VoltGuard API (all mounted under /api/)."""

from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health, name="health"),
    path("model/info", views.model_info, name="model-info"),
    path("auth/register", views.register, name="register"),
    path("auth/login", views.login, name="login"),
    path("auth/demo", views.demo_login, name="demo"),
    path("auth/me", views.me, name="me"),
    path("predict", views.predict, name="predict"),
    path("predict/batch", views.predict_batch, name="predict-batch"),
    path("history", views.history, name="history"),
    path("history/<int:prediction_id>", views.delete_prediction, name="delete-prediction"),
    path("stats", views.stats, name="stats"),
    path("analytics/overview", views.analytics_overview, name="analytics-overview"),
    path("analytics/timeseries", views.analytics_timeseries, name="analytics-timeseries"),
    path("analytics/distributions", views.analytics_distributions, name="analytics-distributions"),
    path("analytics/correlation", views.analytics_correlation, name="analytics-correlation"),
    path("analytics/samples", views.analytics_samples, name="analytics-samples"),
]
