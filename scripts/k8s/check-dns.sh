#!/usr/bin/env bash

set -euo pipefail

SERVICE_NAME="${1:-}"
NAMESPACE="${2:-default}"

if [[ -z "${SERVICE_NAME}" ]]; then
  echo "Usage: $0 <service-name> [namespace]"
  echo "Example: $0 catalog-service dev"
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Error: kubectl is not installed or not in PATH"
  exit 1
fi

if ! kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo "Error: service '${SERVICE_NAME}' not found in namespace '${NAMESPACE}'"
  exit 1
fi

TMP_POD="dns-check-$(date +%s)"

echo "=================================================="
echo "DNS CHECK"
echo "SERVICE: ${SERVICE_NAME}"
echo "NAMESPACE: ${NAMESPACE}"
echo "=================================================="
echo

echo ">>> Creating temporary pod: ${TMP_POD}"
kubectl run "${TMP_POD}" \
  -n "${NAMESPACE}" \
  --image=busybox:1.36 \
  --restart=Never \
  --command -- sleep 120 >/dev/null

cleanup() {
  kubectl delete pod "${TMP_POD}" -n "${NAMESPACE}" --ignore-not-found >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo ">>> Waiting for pod to be Ready"
kubectl wait --for=condition=Ready pod/"${TMP_POD}" -n "${NAMESPACE}" --timeout=60s >/dev/null

echo
echo ">>> nslookup short name"
kubectl exec -n "${NAMESPACE}" "${TMP_POD}" -- nslookup "${SERVICE_NAME}" || true
echo

echo ">>> nslookup full cluster DNS"
kubectl exec -n "${NAMESPACE}" "${TMP_POD}" -- nslookup "${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local" || true
echo

echo ">>> Service ClusterIP"
kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" -o wide
echo

echo ">>> Endpoints"
kubectl get endpoints "${SERVICE_NAME}" -n "${NAMESPACE}" -o wide || true
echo

echo "✅ DNS check finished"