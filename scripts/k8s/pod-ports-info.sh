#!/usr/bin/env bash

set -euo pipefail

POD_NAME="${1:-}"
NAMESPACE="${2:-default}"

if [[ -z "${POD_NAME}" ]]; then
  echo "Usage: $0 <pod-name> [namespace]"
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

if ! kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo "Error: pod '${POD_NAME}' not found in namespace '${NAMESPACE}'"
  exit 1
fi

echo "=================================================="
echo "POD: ${POD_NAME}"
echo "NAMESPACE: ${NAMESPACE}"
echo "=================================================="
echo

echo ">>> BASIC"
kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" -o json | jq -r '
  "Status: \(.status.phase)",
  "Pod IP: \(.status.podIP // "-")",
  "Node: \(.spec.nodeName // "-")",
  "Service Account: \(.spec.serviceAccountName // "-")"
'
echo

echo ">>> CONTAINER"
kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" -o json | jq -r '
  .spec.containers[] |
  "Name: \(.name)",
  "Image: \(.image)",
  (
    if (.ports // []) | length > 0 then
      "Ports: " + ((.ports // []) | map("\(.containerPort)/\(.protocol // "TCP")") | join(", "))
    else
      "Ports: none"
    end
  ),
  (
    "Requests: cpu=" + (.resources.requests.cpu // "-") + ", mem=" + (.resources.requests.memory // "-")
  ),
  (
    "Limits: cpu=" + (.resources.limits.cpu // "-") + ", mem=" + (.resources.limits.memory // "-")
  ),
  (
    "Readiness: " + (if .readinessProbe then "yes" else "no" end)
  ),
  (
    "Liveness: " + (if .livenessProbe then "yes" else "no" end)
  ),
  (
    "Startup: " + (if .startupProbe then "yes" else "no" end)
  )
'
echo

echo ">>> MATCHING SERVICES"
POD_LABELS_JSON="$(kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" -o json | jq -c '.metadata.labels')"
MATCHED_SERVICES=()

while IFS= read -r svc; do
  svc_name="$(jq -r '.metadata.name' <<< "${svc}")"
  selector="$(jq -c '.spec.selector // {}' <<< "${svc}")"

  if [[ "${selector}" == "{}" ]]; then
    continue
  fi

  match="true"
  while IFS='=' read -r key value; do
    pod_value="$(jq -r --arg k "${key}" '.[$k] // empty' <<< "${POD_LABELS_JSON}")"
    if [[ "${pod_value}" != "${value}" ]]; then
      match="false"
      break
    fi
  done < <(jq -r 'to_entries[] | "\(.key)=\(.value)"' <<< "${selector}")

  if [[ "${match}" == "true" ]]; then
    MATCHED_SERVICES+=("${svc_name}")
  fi
done < <(kubectl get svc -n "${NAMESPACE}" -o json | jq -c '.items[]')

if [[ ${#MATCHED_SERVICES[@]} -eq 0 ]]; then
  echo "No matching services"
  echo
else
  for svc in "${MATCHED_SERVICES[@]}"; do
    echo "Service: ${svc}"
    kubectl get svc "${svc}" -n "${NAMESPACE}" -o json | jq -r '
      (.spec.ports // [])[] |
      "  port=" + (.port|tostring) +
      " targetPort=" + (.targetPort|tostring) +
      " protocol=" + (.protocol // "TCP") +
      " name=" + (.name // "-")
    '
    echo "  Endpoints:"
    kubectl get endpoints "${svc}" -n "${NAMESPACE}" -o json | jq -r '
      if (.subsets // []) | length > 0 then
        .subsets[] |
        (.addresses // [])[]? as $a |
        (.ports // [])[]? as $p |
        "    - " + ($a.ip // "-") + ":" + ($p.port|tostring)
      else
        "    none"
      end
    '
    echo
  done
fi

echo ">>> LAST EVENTS"
kubectl get events -n "${NAMESPACE}" --field-selector involvedObject.name="${POD_NAME}" --sort-by=.lastTimestamp | tail -n 10 || true