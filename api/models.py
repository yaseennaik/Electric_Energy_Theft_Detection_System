"""Django ORM models for users and stored predictions."""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, full_name="Energy Analyst", **extra_fields):
        if not email:
            raise ValueError("An email address is required")
        user = self.model(
            email=self.normalize_email(email).lower(),
            full_name=full_name or "Energy Analyst",
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """Email/password account. Passwords use Django's PBKDF2-SHA256 hasher."""

    email = models.EmailField(max_length=255, unique=True)
    full_name = models.CharField(max_length=120, default="Energy Analyst")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Prediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    batch_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    source = models.CharField(max_length=16, default="single")

    timestamp_value = models.CharField(max_length=64, null=True, blank=True)
    electricity_consumed = models.FloatField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    wind_speed = models.FloatField()
    avg_of_past12 = models.FloatField()

    threshold = models.FloatField()
    probability = models.FloatField()
    prediction = models.IntegerField()
    risk_level = models.CharField(max_length=16)

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"Prediction {self.id} ({self.risk_level})"
