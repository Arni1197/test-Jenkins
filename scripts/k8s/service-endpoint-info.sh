#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-}"
SERVICE_NAME="${2:-}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "ERROR: kubectl not found"
  exit 1
fi

if [[ -z "${NAMESPACE}" || -z "${SERVICE_NAME}" ]]; then
  echo "Usage: $0 <namespace> <service-name>"
  echo "Example: $0 dev auth-service"
  exit 1
fi

if ! kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo "ERROR: service '${SERVICE_NAME}' not found in namespace '${NAMESPACE}'"
  exit 1
fi

echo "===================="
echo "SERVICE BASIC INFO"
echo "===================="
kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" -o wide

echo
echo "===================="
echo "SERVICE PORTS"
echo "===================="
kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" \
  -o jsonpath='{range .spec.ports[*]}name={.name} port={.port} targetPort={.targetPort} protocol={.protocol}{"\n"}{end}'

echo
echo "===================="
echo "SERVICE SELECTOR"
echo "===================="
kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" \
  -o go-template='{{range $k, $v := .spec.selector}}{{printf "%s=%s\n" $k $v}}{{end}}'

SELECTOR="$(kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" \
  -o go-template='{{range $k, $v := .spec.selector}}{{printf "%s=%s," $k $v}}{{end}}' | sed 's/,$//')"

echo
echo "Selector string: ${SELECTOR}"

echo
echo "===================="
echo "ENDPOINTS"
echo "===================="
kubectl get endpoints "${SERVICE_NAME}" -n "${NAMESPACE}" -o wide || true

echo
echo "===================="
echo "ENDPOINT SLICES"
echo "===================="
kubectl get endpointslice -n "${NAMESPACE}" \
  -l kubernetes.io/service-name="${SERVICE_NAME}" -o wide || true

if [[ -z "${SELECTOR}" ]]; then
  echo
  echo "No selector found on service. Skipping pod lookup."
  exit 0
fi

echo
echo "===================="
echo "MATCHING PODS"
echo "===================="
kubectl get pods -n "${NAMESPACE}" -l "${SELECTOR}" -o wide || true

echo
echo "===================="
echo "CONTAINER PORTS"
echo "===================="
kubectl get pods -n "${NAMESPACE}" -l "${SELECTOR}" \
  -o jsonpath='{range .items[*]}POD={.metadata.name}{"\n"}{range .spec.containers[*]}  CONTAINER={.name}{"\n"}{range .ports[*]}    containerPort={.containerPort} protocol={.protocol}{"\n"}{end}{end}{"\n"}{end}' || true
