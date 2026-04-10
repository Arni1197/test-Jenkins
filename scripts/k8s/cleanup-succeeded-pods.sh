#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Error: kubectl is not installed or not in PATH"
  exit 1
fi

delete_phase() {
  local phase="$1"

  if [[ -n "${NAMESPACE}" ]]; then
    kubectl get pods -n "${NAMESPACE}" --field-selector="status.phase=${phase}"
    echo
    kubectl delete pods -n "${NAMESPACE}" --field-selector="status.phase=${phase}" || true
  else
    kubectl get pods -A --field-selector="status.phase=${phase}"
    echo
    kubectl delete pods -A --field-selector="status.phase=${phase}" || true
  fi
}

echo ">>> Cleaning finished pods"
echo

echo ">>> Succeeded"
delete_phase "Succeeded"

echo
echo ">>> Failed"
delete_phase "Failed"