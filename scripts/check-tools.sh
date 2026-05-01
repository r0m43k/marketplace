#!/usr/bin/env sh
set -eu

missing=0

check_command() {
  name="$1"
  command="$2"

  printf 'Checking %s...\n' "$name"
  if sh -c "$command"; then
    printf '\n'
    return 0
  fi

  missing=1
  printf 'Missing or not available in PATH: %s\n\n' "$name"
}

check_optional_command() {
  name="$1"
  command="$2"

  printf 'Checking %s...\n' "$name"
  if sh -c "$command"; then
    printf '\n'
    return 0
  fi

  printf 'Optional tool is missing or not available in PATH: %s\n\n' "$name"
}

check_command "docker" "docker --version"
check_command "docker compose" "docker compose version"
check_command "node" "node --version"
check_command "npm" "npm --version"
check_command "kubectl" "kubectl version --client"
check_command "minikube" "minikube version"
check_optional_command "helm" "helm version"

if [ "$missing" -ne 0 ]; then
  echo "Some required tools are missing or not available in PATH."
  exit 1
fi

echo "All required tools are available."
