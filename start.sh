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

echo ""
echo "  VoltGuard → http://localhost:8000"
echo "  API docs  → http://localhost:8000/docs"
echo ""

.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
