#!/usr/bin/env sh
set -eu

NAMESPACE="${NAMESPACE:-marketplace}"

kubectl exec -n "$NAMESPACE" deployment/backend -- python manage.py seed_demo_data "$@"
