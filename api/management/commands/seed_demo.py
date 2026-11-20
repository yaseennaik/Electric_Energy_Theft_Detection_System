"""Seed the demo account and its sample activity: python manage.py seed_demo."""

from django.conf import settings
from django.core.management.base import BaseCommand

from api.seed import seed_demo


class Command(BaseCommand):
    help = "Create the demo user and sample prediction history (idempotent)."

    def handle(self, *args, **options):
        user, created_rows = seed_demo()
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo account ready: {user.email} "
                f"({created_rows} activity row(s) added)"
            )
        )
        self.stdout.write(f"Demo password: {settings.DEMO_PASSWORD}")
