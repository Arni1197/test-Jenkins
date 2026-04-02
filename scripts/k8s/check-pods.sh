#!/usr/bin/env bash
set -euo pipefail

echo "===== ALL PODS ====="
kubectl get pods -A -o wide

echo
echo "===== NOT READY PODS ====="
kubectl get pods -A --no-headers | awk '$3 != "Running" || $2 !~ /^[0-9]+\/\1$/ {print}'

echo
echo "===== PROBLEM PODS (CrashLoopBackOff / Error / Pending / ImagePullBackOff) ====="
kubectl get pods -A --no-headers | awk '
  $4 ~ /CrashLoopBackOff|Error|Pending|ImagePullBackOff|ErrImagePull|ContainerCreating/ {
    print
  }
'