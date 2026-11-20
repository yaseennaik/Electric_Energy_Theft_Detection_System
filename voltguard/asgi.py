"""ASGI entry point for VoltGuard."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "voltguard.settings")

application = get_asgi_application()
