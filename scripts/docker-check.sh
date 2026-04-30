#!/usr/bin/env sh
set -eu

docker compose config
docker compose build
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py check
docker compose up -d

curl -fsS http://localhost:8080/healthz/ >/dev/null
curl -fsS http://localhost:8080/api/products/ >/dev/null

echo "Docker stack check passed"
