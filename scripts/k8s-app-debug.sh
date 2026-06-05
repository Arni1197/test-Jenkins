#!/usr/bin/env bash
set -euo pipefail

K="${KUBECTL:-kubectl}"
NS="${1:-prod}"
APP="${2:-}"

if [ -z "$APP" ]; then
  echo "Usage: ./k8s-app-debug.sh <namespace> <app-name>"
  echo "Example: ./k8s-app-debug.sh prod catalog-service"
  exit 1
fi

echo "== App debug: $NS/$APP =="

echo
echo "== Deployment =="
$K describe deploy "$APP" -n "$NS" || true

echo
echo "== Pods =="
$K get pods -n "$NS" -o wide | grep "$APP" || true

echo
echo "== Service =="
$K get svc "$APP" -n "$NS" -o yaml || true

echo
echo "== Endpoints =="
$K get endpoints "$APP" -n "$NS" -o yaml || true

echo
echo "== Last logs =="
POD="$($K get pods -n "$NS" -o name | grep "$APP" | head -1 | sed 's#pod/##' || true)"

if [ -n "$POD" ]; then
  $K logs -n "$NS" "$POD" --tail=80 || true
else
  echo "No pod found for $APP"
fi

echo
echo "== Recent events =="
$K get events -n "$NS" --sort-by=.lastTimestamp | tail -50