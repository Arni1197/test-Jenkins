#!/usr/bin/env bash

set -euo pipefail

APP_NAME="${1:-}"
NAMESPACE="${2:-default}"

if [[ -z "${APP_NAME}" ]]; then
  echo "Usage: $0 <app-name> [namespace]"
  echo "Example: $0 catalog-service dev"
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

echo "=================================================="
echo "SERVICE READINESS CHECK"
echo "APP: ${APP_NAME}"
echo "NAMESPACE: ${NAMESPACE}"
echo "=================================================="
echo

FAIL=0

# 1. Deployment
echo ">>> 1. DEPLOYMENT"
if kubectl get deploy "${APP_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  DEPLOY_JSON="$(kubectl get deploy "${APP_NAME}" -n "${NAMESPACE}" -o json)"
  DESIRED="$(echo "${DEPLOY_JSON}" | jq -r '.spec.replicas // 0')"
  READY="$(echo "${DEPLOY_JSON}" | jq -r '.status.readyReplicas // 0')"
  AVAILABLE="$(echo "${DEPLOY_JSON}" | jq -r '.status.availableReplicas // 0')"

  echo "Deployment: found"
  echo "Desired replicas: ${DESIRED}"
  echo "Ready replicas: ${READY}"
  echo "Available replicas: ${AVAILABLE}"

  if [[ "${READY}" != "${DESIRED}" ]]; then
    echo "❌ Deployment is not fully ready"
    FAIL=1
  else
    echo "✅ Deployment is ready"
  fi
else
  echo "❌ Deployment '${APP_NAME}' not found"
  FAIL=1
fi
echo

# 2. Pods
echo ">>> 2. PODS"
PODS_JSON="$(kubectl get pods -n "${NAMESPACE}" -l "app.kubernetes.io/name=${APP_NAME}" -o json 2>/dev/null || true)"
POD_COUNT="$(echo "${PODS_JSON}" | jq '.items | length')"

if [[ "${POD_COUNT}" == "0" ]]; then
  echo "❌ No pods found with label app.kubernetes.io/name=${APP_NAME}"
  FAIL=1
else
  echo "Pods found: ${POD_COUNT}"
  echo

  echo "${PODS_JSON}" | jq -r '
    .items[] |
    "Pod: \(.metadata.name)\n" +
    "  Phase: \(.status.phase)\n" +
    "  Pod IP: \(.status.podIP // "-")\n" +
    "  Node: \(.spec.nodeName // "-")\n" +
    "  Ready: " +
    (
      ([.status.containerStatuses[]? | select(.ready == true)] | length | tostring)
      + "/"
      + ([.spec.containers[]?] | length | tostring)
    ) + "\n" +
    "  Restarts: " + (([.status.containerStatuses[]?.restartCount] | add) // 0 | tostring)
  '
  echo

  NOT_READY_COUNT="$(echo "${PODS_JSON}" | jq '[.items[] | select(((.status.containerStatuses // []) | any(.ready == false)) or .status.phase != "Running")] | length')"

  if [[ "${NOT_READY_COUNT}" != "0" ]]; then
    echo "❌ Some pods are not Ready or not Running"
    FAIL=1
  else
    echo "✅ All pods are Running and Ready"
  fi
fi
echo

# 3. Container ports and probes
echo ">>> 3. CONTAINER PORTS / PROBES"
if [[ "${POD_COUNT}" != "0" ]]; then
  FIRST_POD_JSON="$(echo "${PODS_JSON}" | jq '.items[0]')"

  echo "${FIRST_POD_JSON}" | jq -r '
    .spec.containers[] |
    "Container: \(.name)\n" +
    (
      if (.ports // []) | length > 0 then
        "  Ports: " + ((.ports // []) | map((.containerPort|tostring) + "/" + (.protocol // "TCP")) | join(", ")) + "\n"
      else
        "  Ports: none\n"
      end
    ) +
    "  Readiness probe: " + (if .readinessProbe then "yes" else "no" end) + "\n" +
    "  Liveness probe: " + (if .livenessProbe then "yes" else "no" end) + "\n" +
    "  Startup probe: " + (if .startupProbe then "yes" else "no" end)
  '
fi
echo

# 4. Service
echo ">>> 4. SERVICE"
if kubectl get svc "${APP_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  SVC_JSON="$(kubectl get svc "${APP_NAME}" -n "${NAMESPACE}" -o json)"
  echo "Service: found"
  echo "Type: $(echo "${SVC_JSON}" | jq -r '.spec.type')"
  echo

  echo "${SVC_JSON}" | jq -r '
    .spec.ports[] |
    "  - name=" + (.name // "-") +
    " port=" + (.port|tostring) +
    " targetPort=" + (.targetPort|tostring) +
    " protocol=" + (.protocol // "TCP")
  '
else
  echo "❌ Service '${APP_NAME}' not found"
  FAIL=1
fi
echo

# 5. Port matching check
echo ">>> 5. PORT MATCHING CHECK"
if [[ "${POD_COUNT}" != "0" ]] && kubectl get svc "${APP_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  CONTAINER_PORTS="$(echo "${FIRST_POD_JSON}" | jq -r '[.spec.containers[].ports[]?.containerPort] | unique | join(",")')"
  TARGET_PORTS="$(echo "${SVC_JSON}" | jq -r '[.spec.ports[].targetPort] | map(tostring) | unique | join(",")')"

  echo "Container ports: ${CONTAINER_PORTS:-none}"
  echo "Service targetPorts: ${TARGET_PORTS:-none}"

  if [[ -z "${CONTAINER_PORTS}" || -z "${TARGET_PORTS}" ]]; then
    echo "⚠️ Unable to compare ports fully"
  elif [[ "${CONTAINER_PORTS}" == "${TARGET_PORTS}" ]]; then
    echo "✅ targetPort matches containerPort"
  else
    echo "⚠️ targetPort and containerPort differ, check mapping carefully"
  fi
fi
echo

# 6. Endpoints
echo ">>> 6. ENDPOINTS"
if kubectl get endpoints "${APP_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  EP_JSON="$(kubectl get endpoints "${APP_NAME}" -n "${NAMESPACE}" -o json)"
  ADDR_COUNT="$(echo "${EP_JSON}" | jq '[.subsets[]?.addresses[]?] | length')"

  if [[ "${ADDR_COUNT}" == "0" ]]; then
    echo "❌ No endpoints found for service"
    FAIL=1
  else
    echo "Endpoints:"
    echo "${EP_JSON}" | jq -r '
      .subsets[]? |
      (.addresses[]? as $a | .ports[]? as $p | "  - " + ($a.ip // "-") + ":" + ($p.port|tostring))
    '
    echo "✅ Endpoints exist"
  fi
else
  echo "❌ Endpoints resource not found"
  FAIL=1
fi
echo

# 7. Metrics
echo ">>> 7. METRICS CHECK"
if [[ "${POD_COUNT}" != "0" ]]; then
  POD_NAME="$(echo "${FIRST_POD_JSON}" | jq -r '.metadata.name')"
  CONTAINER_PORT="$(echo "${FIRST_POD_JSON}" | jq -r '.spec.containers[0].ports[0].containerPort // empty')"

  if [[ -n "${CONTAINER_PORT}" ]]; then
    echo "Checking /api/metrics on pod ${POD_NAME}:${CONTAINER_PORT} ..."
    if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- sh -c "wget -qO- http://127.0.0.1:${CONTAINER_PORT}/api/metrics >/dev/null 2>&1 || curl -sf http://127.0.0.1:${CONTAINER_PORT}/api/metrics >/dev/null 2>&1" 2>/dev/null; then
      echo "✅ /api/metrics is reachable from inside pod"
    else
      echo "⚠️ /api/metrics is not reachable from inside pod"
    fi
  else
    echo "⚠️ No containerPort found, skipping metrics check"
  fi
else
  echo "⚠️ No pod available, skipping metrics check"
fi
echo

# 8. Recent events
echo ">>> 8. RECENT EVENTS"
kubectl get events -n "${NAMESPACE}" --sort-by=.lastTimestamp | grep -E "${APP_NAME}|LAST SEEN" | tail -n 10 || true
echo

# Final verdict
echo "=================================================="
if [[ "${FAIL}" == "0" ]]; then
  echo "✅ VERDICT: ${APP_NAME} in namespace ${NAMESPACE} looks READY"
else
  echo "❌ VERDICT: ${APP_NAME} in namespace ${NAMESPACE} is NOT READY"
fi
echo "=================================================="