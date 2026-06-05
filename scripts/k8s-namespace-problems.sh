#!/usr/bin/env bash
set -euo pipefail

NS="${1:-prod}"

echo "== Namespace: $NS =="

echo
echo "== Problem pods =="
kubectl get pods -n "$NS" --no-headers | awk '$3 != "Running" && $3 != "Completed" {print}' || true

echo
echo "== Pods with restarts =="
kubectl get pods -n "$NS" --no-headers | awk '$4 > 0 {print}' || true

echo
echo "== Deployments not fully ready =="
kubectl get deploy -n "$NS" --no-headers | awk '$2 !~ /^[0-9]+\/\1$/ {print}' || true

echo
echo "== Recent Warning events =="
kubectl get events -n "$NS" --field-selector type=Warning --sort-by=.lastTimestamp | tail -50