#!/usr/bin/env bash
set -euo pipefail

echo "===== INGRESS ====="
kubectl get ingress -A -o wide || true

echo
echo "===== SERVICES ====="
kubectl get svc -A -o wide

echo
echo "===== ENDPOINTS ====="
kubectl get endpoints -A