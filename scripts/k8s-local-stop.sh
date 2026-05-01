#!/usr/bin/env sh
set -eu

PROFILE="${MINIKUBE_PROFILE:-marketplace}"

minikube -p "$PROFILE" stop
