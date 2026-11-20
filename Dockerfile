# ---- Frontend build -------------------------------------------------------
FROM node:24-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- API runtime ----------------------------------------------------------
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
RUN mkdir -p /app/data

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY manage.py ./
COPY voltguard ./voltguard
COPY api ./api
COPY Dataset ./Dataset
COPY Models ./Models
COPY --from=frontend /build/frontend/dist ./frontend/dist

EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_demo && python manage.py runserver 0.0.0.0:8000"]
