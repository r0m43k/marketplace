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

## Step 5: Docker Stack Check Was Added

Docker check scripts were added for local verification.

Scripts:

- `scripts/docker-check.ps1` - Windows PowerShell check
- `scripts/docker-check.sh` - Linux/macOS shell check

The check validates compose config, builds images, starts Postgres, runs migrations, starts the stack, and checks API health.

Run on Windows:

```powershell
.\scripts\docker-check.ps1
```

Run on Linux:

```bash
sh scripts/docker-check.sh
```

Manual equivalent:

```bash
docker compose config
docker compose build
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py check
docker compose up -d
```

Check URLs:

```text
http://localhost:8080/healthz/
http://localhost:8080/api/products/
```

## Step 6: Demo Seed Data Was Added

A Django management command was added:

```text
marketplace/management/commands/seed_demo_data.py
```

It creates demo users, categories, products, and reviews.

Run after migrations:

```bash
docker compose run --rm backend python manage.py seed_demo_data
```

Reset and reseed demo data:

```bash
docker compose run --rm backend python manage.py seed_demo_data --reset
```

Demo users:

```text
demo_seller / DemoSeller123!
demo_buyer / DemoBuyer123!
```

## Step 7: Production Backend Settings Were Added

Backend settings were prepared for Docker and future Kubernetes deployment.

Added production-ready settings:

- environment-based `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS`
- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`
- proxy header support with `USE_X_FORWARDED_HOST`
- optional HTTPS redirect
- secure cookie flags
- HSTS settings
- WhiteNoise static file serving
- stricter security headers

Important environment variables:

```env
SECRET_KEY=change-me
DEBUG=False
ALLOWED_HOSTS=marketplace.example.com
CSRF_TRUSTED_ORIGINS=https://marketplace.example.com
CORS_ALLOWED_ORIGINS=https://marketplace.example.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

For local Docker development these values stay relaxed in `.env.example`.

## Step 8: CI Was Added

GitHub Actions CI was added:

```text
.github/workflows/ci.yml
```

CI jobs:

- backend: install Python dependencies, run Django checks, verify migrations are committed
- frontend: install Node dependencies and build React/Vite app
- docker: validate Docker Compose and build Docker images

The workflow runs on pull requests and pushes to `main` or `master`.
