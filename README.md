# Marketplace

Django + React marketplace project.

## Stack

- Python / Django / Django REST Framework
- PostgreSQL
- React / Vite
- Nginx
- Docker / Docker Compose
- Kubernetes / Helm
- GitHub Actions
- Terraform / Ansible
- Prometheus / Grafana
- Loki / Promtail
- RabbitMQ / Celery
- MinIO / S3

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
- helm: lint and render the Helm chart

The workflow runs on pull requests and pushes to `main` or `master`.

## Step 9: Kubernetes Base Manifests Were Added

Base Kubernetes manifests were added to:

```text
deploy/k8s/
```

Files:

- `namespace.yaml` - project namespace
- `configmap.yaml` - non-secret backend configuration
- `secret.example.yaml` - example secret values
- `postgres.yaml` - PostgreSQL Service and StatefulSet
- `migration-job.yaml` - one-off Django migration Job
- `backend.yaml` - Django backend Service and Deployment
- `frontend.yaml` - React/Nginx frontend Service and Deployment
- `ingress.yaml` - external HTTP route
- `kustomization.yaml` - apply all manifests with Kustomize

Default local Kubernetes images:

```text
marketplace-backend:latest
marketplace-frontend:latest
```

For a real cluster, replace them with registry images, for example:

```text
ghcr.io/your-org/marketplace-backend:latest
ghcr.io/your-org/marketplace-frontend:latest
```

Create namespace and runtime secret:

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl create secret generic marketplace-secret \
  -n marketplace \
  --from-literal=SECRET_KEY=change-me \
  --from-literal=DB_PASSWORD=marketplace
```

Apply all manifests:

```bash
kubectl apply -k deploy/k8s
```

Run migrations again after changing backend models:

```bash
kubectl delete job marketplace-migrate -n marketplace --ignore-not-found
kubectl apply -f deploy/k8s/migration-job.yaml
```

Check rollout:

```bash
kubectl get pods -n marketplace
kubectl get svc -n marketplace
kubectl get ingress -n marketplace
```

If using `marketplace.local`, add it to local hosts file and point it to the Ingress controller IP.

For production, do not use `secret.example.yaml` as-is. Create a real Kubernetes Secret with a strong `SECRET_KEY` and database password.

## Step 10: Container Image Strategy Was Added

Kubernetes now has a GHCR overlay:

```text
deploy/k8s/overlays/ghcr/kustomization.yaml
```

Base manifests keep local image names:

```text
marketplace-backend:latest
marketplace-frontend:latest
```

The GHCR overlay rewrites them to registry images:

```text
ghcr.io/your-org/marketplace-backend:latest
ghcr.io/your-org/marketplace-frontend:latest
```

Manual build and push example:

```bash
docker build -t ghcr.io/YOUR_USER/marketplace-backend:latest .
docker build -t ghcr.io/YOUR_USER/marketplace-frontend:latest ./frontend
docker push ghcr.io/YOUR_USER/marketplace-backend:latest
docker push ghcr.io/YOUR_USER/marketplace-frontend:latest
```

Recommended image tags:

- `latest` for quick test deploys
- commit SHA for CI/CD deploys
- semantic version tags for releases

Apply the GHCR overlay after replacing `your-org` or after CI patches it:

```bash
kubectl apply -k deploy/k8s/overlays/ghcr
```

## Step 11: Container Image CI Was Added

GitHub Actions workflow was added:

```text
.github/workflows/container-images.yml
```

It builds and pushes images to GitHub Container Registry:

```text
ghcr.io/<github-owner>/marketplace-backend:<commit-sha>
ghcr.io/<github-owner>/marketplace-backend:latest
ghcr.io/<github-owner>/marketplace-frontend:<commit-sha>
ghcr.io/<github-owner>/marketplace-frontend:latest
```

The workflow runs on pushes to `main` or `master`, and can also be started manually.

No extra registry token is required for GHCR in this repository because the workflow uses `GITHUB_TOKEN` with `packages: write`.

For Kubernetes pulls, either make GHCR packages public or create an `imagePullSecret` in the cluster and patch deployments to use it. Private GHCR images without an `imagePullSecret` will fail with `ImagePullBackOff`.

## Step 12: Manual Kubernetes Deploy Workflow Was Added

Manual deploy workflow was added:

```text
.github/workflows/deploy-k8s.yml
```

It does not deploy automatically. It runs only through `workflow_dispatch`.

Required GitHub secret:

```text
KUBE_CONFIG_B64
```

Create it from your kubeconfig:

```bash
base64 -w 0 ~/.kube/config
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\.kube\config"))
```

Before running the deploy workflow, create the runtime Kubernetes Secret in the cluster:

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl create secret generic marketplace-secret \
  -n marketplace \
  --from-literal=SECRET_KEY=change-me \
  --from-literal=DB_PASSWORD=marketplace
```

Deploy a specific image tag from GitHub Actions by entering:

```text
image_tag=<commit-sha>
```

The workflow:

- patches the GHCR overlay with the current repository owner
- applies Kubernetes manifests
- runs the migration Job
- waits for backend and frontend rollouts

## Step 13: Helm Chart Was Added

A Helm chart was added:

```text
deploy/helm/marketplace/
```

Files:

- `Chart.yaml` - chart metadata
- `values.yaml` - default deploy values
- `templates/configmap.yaml` - backend config
- `templates/secret.yaml` - optional secret creation
- `templates/postgres.yaml` - PostgreSQL Service and StatefulSet
- `templates/backend.yaml` - backend Service and Deployment
- `templates/frontend.yaml` - frontend Service and Deployment
- `templates/migration-job.yaml` - migration Job as Helm hook
- `templates/ingress.yaml` - ingress route

Render chart locally:

```bash
helm template marketplace deploy/helm/marketplace --namespace marketplace
```

Lint chart:

```bash
helm lint deploy/helm/marketplace
```

The main CI workflow also lints and renders this chart.

Install or upgrade:

```bash
helm upgrade --install marketplace deploy/helm/marketplace \
  --namespace marketplace \
  --create-namespace
```

Deploy GHCR images:

```bash
helm upgrade --install marketplace deploy/helm/marketplace \
  --namespace marketplace \
  --create-namespace \
  --set backend.image.repository=ghcr.io/YOUR_USER/marketplace-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=ghcr.io/YOUR_USER/marketplace-frontend \
  --set frontend.image.tag=latest
```

Use an existing Kubernetes Secret instead of creating one from Helm values:

```bash
helm upgrade --install marketplace deploy/helm/marketplace \
  --namespace marketplace \
  --create-namespace \
  --set secret.create=false \
  --set secret.name=marketplace-secret
```

The migration Job runs as a `post-install,post-upgrade` Helm hook.

## Step 14: Basic Observability Was Added

Basic container-friendly observability was added.

Backend:

- Gunicorn access logs go to stdout
- Gunicorn error logs go to stderr
- Django logs go to console
- log level is controlled with `LOG_LEVEL`

Environment variable:

```env
LOG_LEVEL=INFO
```

Docker logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Kubernetes logs:

```bash
kubectl logs -n marketplace deployment/backend -f
kubectl logs -n marketplace deployment/frontend -f
kubectl logs -n marketplace statefulset/postgres -f
```

Health endpoints:

```text
/healthz/
/api/products/
```

Kubernetes readiness and liveness probes are configured for:

- backend
- frontend
- postgres

Resource requests and limits are configured in both raw Kubernetes manifests and Helm values.

## Step 15: Local Toolchain Validation

Before running the project locally, check that required tools are available in your terminal:

```powershell
.\scripts\check-tools.ps1
```

Required local tools:

- Docker Desktop with Docker Compose
- Node.js and npm
- kubectl
- Helm

Install them on Windows:

```powershell
.\scripts\install-tools-windows.ps1
```

If a tool was just installed on Windows and the command is still not found, close the terminal and open it again so `PATH` is reloaded.

These local installations are not copied into CI/CD. GitHub Actions installs or provides tools on the runner:

- Python through `actions/setup-python`
- Node.js through `actions/setup-node`
- Docker Buildx through `docker/setup-buildx-action`
- Helm through `azure/setup-helm`
- kubectl through `azure/setup-kubectl`

After tools are visible locally, run the full Docker check:

```powershell
.\scripts\docker-check.ps1
```
