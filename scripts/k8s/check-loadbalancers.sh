#!/usr/bin/env bash
set -euo pipefail

echo "===== LOADBALANCER SERVICES ====="
kubectl get svc -A --field-selector spec.type=LoadBalancer -o wide || true