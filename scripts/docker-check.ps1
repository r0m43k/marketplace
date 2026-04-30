$ErrorActionPreference = "Stop"

docker compose config
docker compose build
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py check
docker compose up -d

$health = Invoke-WebRequest -UseBasicParsing "http://localhost:8080/healthz/"
if ($health.StatusCode -ne 200) {
    throw "Healthcheck failed"
}

$api = Invoke-WebRequest -UseBasicParsing "http://localhost:8080/api/products/"
if ($api.StatusCode -ne 200) {
    throw "API check failed"
}

Write-Output "Docker stack check passed"
