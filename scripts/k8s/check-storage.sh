#!/usr/bin/env bash
set -euo pipefail

echo "===== STORAGECLASSES ====="
kubectl get storageclass

echo
echo "===== PVC ====="
kubectl get pvc -A

echo
echo "===== PV ====="
kubectl get pv