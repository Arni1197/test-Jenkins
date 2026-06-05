#!/usr/bin/env bash
set -euo pipefail

echo "== Nodes not Ready =="
kubectl get nodes --no-headers | awk '$2 != "Ready" {print}' || true

echo
echo "== Problem pods =="
kubectl get pods -A --no-headers | awk '$4 != "Running" && $4 != "Completed" {print}' || true

echo
echo "== Pods with restarts =="
kubectl get pods -A --no-headers | awk '$5 > 0 {print}' || true

echo
echo "== Recent Warning events =="
kubectl get events -A --field-selector type=Warning --sort-by=.lastTimestamp | tail -50