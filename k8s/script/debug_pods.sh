#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="default"

log() {
  echo "[INFO] $1"
}

error() {
  echo "[ERROR] $1" >&2
}

show_help() {
  cat <<EOF
Usage:
  $0 [-n <namespace>]

Description:
  Finds problematic pods (Pending, CrashLoopBackOff, Error)
  and prints detailed debug info.

Example:
  $0 -n vault
EOF
}

while getopts ":n:h" opt; do
  case "$opt" in
    n) NAMESPACE="$OPTARG" ;;
    h)
      show_help
      exit 0
      ;;
    \?)
      error "Unknown option"
      exit 1
      ;;
  esac
done

log "Checking namespace: $NAMESPACE"

# Проверка доступа к кластеру
if ! kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
  error "Namespace $NAMESPACE not found"
  exit 1
fi

# Получаем проблемные pod'ы
PROBLEM_PODS=$(kubectl get pods -n "$NAMESPACE" --no-headers | \
  awk '$3 != "Running" && $3 != "Completed" {print $1}')

if [ -z "$PROBLEM_PODS" ]; then
  log "No problematic pods found 🎉"
  exit 0
fi

log "Found problematic pods:"
echo "$PROBLEM_PODS"
echo

# Проходимся по каждому pod
for pod in $PROBLEM_PODS; do
  echo "======================================"
  echo "🔍 POD: $pod"
  echo "======================================"

  echo
  echo "📄 Describe:"
  kubectl describe pod "$pod" -n "$NAMESPACE"

  echo
  echo "📢 Last events:"
  kubectl get events -n "$NAMESPACE" \
    --field-selector involvedObject.name="$pod" \
    --sort-by='.lastTimestamp' | tail -n 10

  echo
done