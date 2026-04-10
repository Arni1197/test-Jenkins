#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${1:-}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Error: kubectl is not installed or not in PATH"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is not installed or not in PATH"
  exit 1
fi

if [[ -n "${NAMESPACE}" ]]; then
  PODS_JSON="$(kubectl get pods -n "${NAMESPACE}" -o json)"
else
  PODS_JSON="$(kubectl get pods -A -o json)"
fi

NOT_RUNNING_COUNT="$(echo "${PODS_JSON}" | jq '[.items[] | select(.status.phase != "Running" or ((.status.containerStatuses // []) | any(.ready == false)))] | length')"

if [[ "${NOT_RUNNING_COUNT}" == "0" ]]; then
  echo "✅ All pods are Running and containers are Ready"
  exit 0
fi

echo "Found ${NOT_RUNNING_COUNT} problematic pod(s)"
echo

echo "${PODS_JSON}" | jq -c '
  .items[]
  | select(
      .status.phase != "Running"
      or ((.status.containerStatuses // []) | any(.ready == false))
    )
' | while IFS= read -r pod; do
  NS="$(echo "${pod}" | jq -r '.metadata.namespace')"
  NAME="$(echo "${pod}" | jq -r '.metadata.name')"
  PHASE="$(echo "${pod}" | jq -r '.status.phase')"
  NODE="$(echo "${pod}" | jq -r '.spec.nodeName // "-"')"
  POD_IP="$(echo "${pod}" | jq -r '.status.podIP // "-"')"

  READY_COUNT="$(echo "${pod}" | jq '[.status.containerStatuses[]? | select(.ready == true)] | length')"
  TOTAL_COUNT="$(echo "${pod}" | jq '[.spec.containers[]?] | length')"
  RESTARTS="$(echo "${pod}" | jq '[.status.containerStatuses[]?.restartCount] | add // 0')"

  IMAGE="$(echo "${pod}" | jq -r '.spec.containers[0].image // "-"')"

  WAITING_REASON="$(echo "${pod}" | jq -r '
    [
      .status.initContainerStatuses[]?.state.waiting.reason,
      .status.containerStatuses[]?.state.waiting.reason
    ]
    | map(select(. != null))
    | .[0] // empty
  ')"

  WAITING_MESSAGE="$(echo "${pod}" | jq -r '
    [
      .status.initContainerStatuses[]?.state.waiting.message,
      .status.containerStatuses[]?.state.waiting.message
    ]
    | map(select(. != null))
    | .[0] // empty
  ')"

  TERMINATED_REASON="$(echo "${pod}" | jq -r '
    [
      .status.initContainerStatuses[]?.lastState.terminated.reason,
      .status.containerStatuses[]?.lastState.terminated.reason,
      .status.containerStatuses[]?.state.terminated.reason
    ]
    | map(select(. != null))
    | .[0] // empty
  ')"

  TERMINATED_EXIT_CODE="$(echo "${pod}" | jq -r '
    [
      .status.initContainerStatuses[]?.lastState.terminated.exitCode,
      .status.containerStatuses[]?.lastState.terminated.exitCode,
      .status.containerStatuses[]?.state.terminated.exitCode
    ]
    | map(select(. != null))
    | .[0] // empty
  ')"

  POD_SCHEDULED="$(echo "${pod}" | jq -r '
    (.status.conditions[]? | select(.type == "PodScheduled") | .status) // "-"
  ')"

  DIAGNOSIS="Unknown"

  if [[ "${WAITING_REASON}" == "CrashLoopBackOff" ]]; then
    DIAGNOSIS="Container crashes after start. Check logs, command, env, DB/Rabbit connectivity, app startup."
  elif [[ "${WAITING_REASON}" == "ImagePullBackOff" ]]; then
    DIAGNOSIS="Image cannot be pulled. Check image name, tag/digest, registry access, imagePullSecrets."
  elif [[ "${WAITING_REASON}" == "ErrImagePull" ]]; then
    DIAGNOSIS="Image pull failed. Check registry, image path, auth, network."
  elif [[ "${WAITING_REASON}" == "CreateContainerConfigError" ]]; then
    DIAGNOSIS="Container config error. Often missing Secret/ConfigMap/env reference."
  elif [[ "${WAITING_REASON}" == "CreateContainerError" ]]; then
    DIAGNOSIS="Container creation failed. Check command, mounts, image, security context."
  elif [[ "${PHASE}" == "Pending" ]]; then
    DIAGNOSIS="Pod is Pending. Usually scheduler/resource/taints/PVC/image pull issue."
  elif [[ "${WAITING_REASON}" == "ContainerCreating" ]]; then
    DIAGNOSIS="Container is still being created. Check image pull, volumes, CNI, node health."
  elif [[ "${TERMINATED_REASON}" == "OOMKilled" ]]; then
    DIAGNOSIS="Container hit memory limit and was killed. Increase memory or fix leak/startup spike."
  elif [[ "${TERMINATED_REASON}" == "Error" ]]; then
    DIAGNOSIS="Container terminated with error. Check logs and exit code."
  elif [[ "${POD_SCHEDULED}" == "False" ]]; then
    DIAGNOSIS="Pod not scheduled. Check node resources, taints/tolerations, affinity, PVC."
  elif [[ "${READY_COUNT}" != "${TOTAL_COUNT}" && "${PHASE}" == "Running" ]]; then
    DIAGNOSIS="Pod is Running but not Ready. Usually readiness probe, startup issue, dependency unavailable."
  fi

  echo "=================================================="
  echo "Namespace: ${NS}"
  echo "Pod: ${NAME}"
  echo "Phase: ${PHASE}"
  echo "Ready: ${READY_COUNT}/${TOTAL_COUNT}"
  echo "Restarts: ${RESTARTS}"
  echo "Node: ${NODE}"
  echo "Pod IP: ${POD_IP}"
  echo "Image: ${IMAGE}"

  if [[ -n "${WAITING_REASON}" ]]; then
    echo "Waiting reason: ${WAITING_REASON}"
  fi

  if [[ -n "${WAITING_MESSAGE}" ]]; then
    echo "Waiting message: ${WAITING_MESSAGE}"
  fi

  if [[ -n "${TERMINATED_REASON}" ]]; then
    echo "Last terminated reason: ${TERMINATED_REASON}"
  fi

  if [[ -n "${TERMINATED_EXIT_CODE}" ]]; then
    echo "Last exit code: ${TERMINATED_EXIT_CODE}"
  fi

  echo "Diagnosis: ${DIAGNOSIS}"
  echo

  echo "Recent events:"
  kubectl get events -n "${NS}" --field-selector involvedObject.name="${NAME}" --sort-by=.lastTimestamp 2>/dev/null | tail -n 8 || true
  echo

  echo "Helpful next commands:"
  echo "  kubectl describe pod ${NAME} -n ${NS}"
  echo "  kubectl logs ${NAME} -n ${NS} --all-containers=true --tail=100"
  echo "  kubectl logs ${NAME} -n ${NS} --previous --all-containers=true --tail=100"
  echo
done