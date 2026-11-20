"""WSGI entry point for VoltGuard."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "voltguard.settings")

application = get_wsgi_application()
