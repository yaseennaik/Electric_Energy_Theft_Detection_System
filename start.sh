#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [ ! -x ".venv/bin/python" ]; then
  echo "Creating virtual environment..."
  python3 -m venv --system-site-packages .venv
  .venv/bin/python -m pip install -r requirements.txt
fi

if [ ! -f "frontend/dist/index.html" ]; then
  echo "Building frontend..."
  (cd frontend && npm install && npm run build)
fi

echo "Applying database migrations..."
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py seed_demo

echo ""
echo "  VoltGuard → http://localhost:8000"
echo "  API       → http://localhost:8000/api/health"
echo "  Demo      → demo@voltguard.io / demo1234"
echo ""

.venv/bin/python manage.py runserver 127.0.0.1:8000
