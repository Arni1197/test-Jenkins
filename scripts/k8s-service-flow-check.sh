#!/usr/bin/env bash
set -euo pipefail

K="${KUBECTL:-kubectl}"
NS="${1:-prod}"
APP="${2:-}"

if [ -z "$APP" ]; then
  echo "Usage: ./k8s-service-flow-check.sh <namespace> <app-name>"
  echo "Example: ./k8s-service-flow-check.sh prod catalog-service"
  exit 1
fi

echo "== Deployment =="
$K get deploy "$APP" -n "$NS" -o wide || true

echo
echo "== Pods =="
$K get pods -n "$NS" -l "app.kubernetes.io/name=$APP" -o wide || \
$K get pods -n "$NS" -l "app=$APP" -o wide || true

echo
echo "== Service =="
$K get svc "$APP" -n "$NS" -o wide || true

echo
echo "== Endpoints =="
$K get endpoints "$APP" -n "$NS" -o wide || true

echo
echo "== Ingress =="
$K get ingress -n "$NS" -o wide | grep "$APP" || true

echo
echo "== Recent Warning events =="
$K get events -n "$NS" --field-selector type=Warning --sort-by=.lastTimestamp | tail -30