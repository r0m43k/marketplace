#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PROFILE="${MINIKUBE_PROFILE:-marketplace}"
DRIVER="${MINIKUBE_DRIVER:-docker}"
NAMESPACE="${NAMESPACE:-marketplace}"
CPUS="${MINIKUBE_CPUS:-4}"
MEMORY="${MINIKUBE_MEMORY:-6144}"
OVERLAY="deploy/k8s/overlays/minikube"

require_command() {
  if command -v "$1" >/dev/null 2>&1; then
    return 0
  fi

  printf 'Missing required command: %s\n' "$1" >&2
  exit 1
}

require_command docker
require_command kubectl
require_command minikube

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not reachable. Start Docker Desktop or the Docker service and try again." >&2
  exit 1
fi

cd "$ROOT_DIR"

minikube -p "$PROFILE" start --driver="$DRIVER" --cpus="$CPUS" --memory="$MEMORY"
minikube -p "$PROFILE" addons enable ingress
kubectl config use-context "$PROFILE" >/dev/null 2>&1 || true

minikube -p "$PROFILE" image build -t marketplace-backend:latest .
minikube -p "$PROFILE" image build -t marketplace-frontend:latest ./frontend

kubectl apply -f deploy/k8s/base/namespace.yaml
kubectl delete job marketplace-migrate -n "$NAMESPACE" --ignore-not-found=true
kubectl apply -k "$OVERLAY"

kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=180s
kubectl wait --for=condition=complete job/marketplace-migrate -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=180s

cluster_ip=$(minikube -p "$PROFILE" ip)

printf '\nCluster is ready.\n'
printf 'Add this hosts entry if you have not already:\n'
printf '  %s marketplace.local\n' "$cluster_ip"
printf '\nThen open:\n'
printf '  http://marketplace.local/\n'
printf '\nOptional next step:\n'
printf '  sh scripts/k8s-local-seed-demo.sh\n'
