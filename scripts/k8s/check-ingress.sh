#!/usr/bin/env bash

set -euo pipefail

INGRESS_NAME="${1:-}"
NAMESPACE="${2:-default}"

if [[ -z "${INGRESS_NAME}" ]]; then
  echo "Usage: $0 <ingress-name> [namespace]"
  echo "Example: $0 api-gateway dev"
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Error: kubectl is not installed or not in PATH"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is not installed or not in PATH"
  exit 1
fi

if ! kubectl get ingress "${INGRESS_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo "Error: ingress '${INGRESS_NAME}' not found in namespace '${NAMESPACE}'"
  exit 1
fi

ING_JSON="$(kubectl get ingress "${INGRESS_NAME}" -n "${NAMESPACE}" -o json)"

echo "=================================================="
echo "INGRESS: ${INGRESS_NAME}"
echo "NAMESPACE: ${NAMESPACE}"
echo "=================================================="
echo

echo ">>> BASIC"
echo "${ING_JSON}" | jq -r '
  "Ingress class: " + (.spec.ingressClassName // "-"),
  "Address: " + (
    if (.status.loadBalancer.ingress // []) | length > 0
    then (.status.loadBalancer.ingress | map(.ip // .hostname // "-") | join(", "))
    else "-"
    end
  )
'
echo

echo ">>> TLS"
TLS_COUNT="$(echo "${ING_JSON}" | jq '[.spec.tls[]?] | length')"
if [[ "${TLS_COUNT}" == "0" ]]; then
  echo "No TLS configured"
else
  echo "${ING_JSON}" | jq -r '
    .spec.tls[] |
    "Secret: " + (.secretName // "-") + " | Hosts: " + ((.hosts // []) | join(", "))
  '
fi
echo

echo ">>> ROUTES"
echo "${ING_JSON}" | jq -r '
  .spec.rules[]? as $rule |
  ($rule.http.paths[]? |
    "Host: " + ($rule.host // "-")
    + " | Path: " + (.path // "/")
    + " | PathType: " + (.pathType // "-")
    + " | Service: " + (.backend.service.name // "-")
    + " | Port: " + (
      if .backend.service.port.number then (.backend.service.port.number|tostring)
      else (.backend.service.port.name // "-")
      end
    )
  )
'
echo

echo ">>> BACKEND SERVICES EXISTENCE"
echo "${ING_JSON}" | jq -r '
  [.spec.rules[]?.http.paths[]?.backend.service.name] | unique[]?
' | while IFS= read -r svc; do
  if kubectl get svc "${svc}" -n "${NAMESPACE}" >/dev/null 2>&1; then
    echo "✅ Service exists: ${svc}"
  else
    echo "❌ Service missing: ${svc}"
  fi
done
echo

echo ">>> QUICK kubectl get ingress"
kubectl get ingress "${INGRESS_NAME}" -n "${NAMESPACE}"