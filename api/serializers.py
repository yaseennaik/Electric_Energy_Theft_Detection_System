"""DRF serializers — the Django equivalent of the old Pydantic schemas."""

from rest_framework import serializers

from .models import Prediction, User


class UserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(min_length=6, max_length=128, write_only=True)
    full_name = serializers.CharField(
        max_length=120, required=False, default="Energy Analyst", allow_blank=True
    )


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True)


class UserOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "created_at"]
        read_only_fields = fields


class PredictionInSerializer(serializers.Serializer):
    electricity_consumed = serializers.FloatField(min_value=0, max_value=1)
    temperature = serializers.FloatField(min_value=0, max_value=1)
    humidity = serializers.FloatField(min_value=0, max_value=1)
    wind_speed = serializers.FloatField(min_value=0, max_value=1)
    avg_of_past12 = serializers.FloatField(
        min_value=0, max_value=1, required=False, allow_null=True, default=None
    )
    threshold = serializers.FloatField(min_value=0, max_value=1, default=0.5)
    timestamp = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, default=None
    )


class ContributionSerializer(serializers.Serializer):
    feature = serializers.CharField()
    label = serializers.CharField()
    value = serializers.FloatField()
    z_score = serializers.FloatField()
    importance = serializers.FloatField()
    share = serializers.FloatField()
    direction = serializers.CharField()


class PredictionOutSerializer(serializers.ModelSerializer):
    contributions = ContributionSerializer(many=True, read_only=True, default=list)

    class Meta:
        model = Prediction
        fields = [
            "id",
            "batch_id",
            "source",
            "timestamp_value",
            "electricity_consumed",
            "temperature",
            "humidity",
            "wind_speed",
            "avg_of_past12",
            "threshold",
            "probability",
            "prediction",
            "risk_level",
            "created_at",
            "contributions",
        ]
        read_only_fields = fields


class HistoryQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=1, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=10)
    prediction = serializers.IntegerField(required=False, allow_null=True, default=None)
    risk = serializers.CharField(required=False, allow_blank=True, default="")
    search = serializers.CharField(required=False, allow_blank=True, default="")


class BatchUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    threshold = serializers.FloatField(min_value=0, max_value=1, default=0.5)


class TimeseriesQuerySerializer(serializers.Serializer):
    limit = serializers.IntegerField(min_value=10, max_value=2000, default=200)
