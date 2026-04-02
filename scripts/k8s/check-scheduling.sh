#!/usr/bin/env bash
set -euo pipefail

echo "===== POD PLACEMENT ====="
kubectl get pods -A -o custom-columns='NAMESPACE:.metadata.namespace,POD:.metadata.name,NODE:.spec.nodeName,PHASE:.status.phase,IP:.status.podIP' | column -t