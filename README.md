# Marketplace

Django + React marketplace project.

## Step 1: Backend Code Was Created

Backend is written with Django and Django REST Framework.

Main backend parts:

- `config/` - Django project settings and root URLs
- `marketplace/models.py` - marketplace domain models
- `marketplace/serializers.py` - API serializers
- `marketplace/views.py` - API viewsets and auth endpoints
- `marketplace/urls.py` - API routes
- `requirements.txt` - Python dependencies

Current API base path:

```text
/api/
```

Healthcheck endpoint:

```text
/healthz/
```

## Step 2: Frontend Code Was Created

Frontend is written with React and Vite.

Main frontend parts:

- `frontend/src/App.jsx` - main application UI and state
- `frontend/src/api.js` - API client
- `frontend/src/styles.css` - minimal black and white interface
- `frontend/package.json` - frontend dependencies and scripts
- `frontend/nginx.conf` - production Nginx config for serving frontend and proxying API

The frontend calls the backend through:

```text
/api
```

In Docker this is handled by Nginx inside the frontend container.

## Step 3: Migrations Were Added

Initial Django migrations were added to:

```text
marketplace/migrations/0001_initial.py
```
Run migrations in Docker:

```bash
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
```

Create an admin user after migrations:

```bash
docker compose run --rm backend python manage.py createsuperuser
```

## Step 4: Docker Containers Were Added

Docker setup was added for local development and future Kubernetes migration.

Main Docker files:

- `Dockerfile` - backend image
- `frontend/Dockerfile` - frontend image
- `frontend/nginx.conf` - Nginx reverse proxy config
- `docker-compose.yml` - local multi-container stack
- `.dockerignore` - Docker build exclusions

Services in Docker Compose:

- `postgres` - PostgreSQL database
- `backend` - Django API served by Gunicorn
- `frontend` - React app served by Nginx

Build containers:

```bash
docker compose build
```

Start full stack:

```bash
docker compose up -d
```

Open frontend:

```text
http://localhost:8080
```

Backend API is also exposed directly:

```text
http://localhost:8000/api/
```

Recommended first run:

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose up -d
```
