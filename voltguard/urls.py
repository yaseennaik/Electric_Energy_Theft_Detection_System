"""Root URL configuration: API routes, built frontend assets and SPA fallback."""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.urls import include, path, re_path
from django.views.static import serve


def serve_spa(request, path: str = ""):
    """Serve the React build, falling back to index.html for client-side routes."""
    root = Path(settings.FRONTEND_DIST).resolve()
    if not (root / "index.html").is_file():
        return HttpResponse(
            "<h1>VoltGuard API is running</h1>"
            "<p>Build the frontend with <code>npm install &amp;&amp; npm run build</code> "
            "inside the <code>frontend</code> folder.</p>"
        )

    requested = (root / path).resolve()
    if requested.is_file() and root in requested.parents:
        return FileResponse(requested.open("rb"))
    return FileResponse((root / "index.html").open("rb"))


urlpatterns = [
    path("api/", include("api.urls")),
    re_path(
        r"^assets/(?P<path>.*)$",
        serve,
        {"document_root": str(settings.FRONTEND_DIST / "assets")},
    ),
    re_path(r"^(?P<path>.*)$", serve_spa),
]
