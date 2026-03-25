#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[INFO] $1"
}

warn() {
  echo "[WARN] $1"
}

error() {
  echo "[ERROR] $1" >&2
}

show_help() {
  cat <<'EOF'
Usage:
  ./cluster_pod_doctor.sh

Description:
  Scans all namespaces in the cluster and finds problematic pods.
  For each problematic pod, prints:
    - namespace
    - pod name
    - phase
    - node
    - container waiting/terminated reasons
    - recent events
    - possible PVC issues for Pending pods

Problematic pods include:
  - not Running
  - Running but with restarts > 0
  - container states like CrashLoopBackOff, Error, ImagePullBackOff, CreateContainerConfigError, Pending

EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  show_help
  exit 0
fi

if ! kubectl get nodes >/dev/null 2>&1; then
  error "Kubernetes cluster is not accessible"
  exit 1
fi

log "Scanning cluster for problematic pods..."

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"|"}{.metadata.name}{"|"}{.status.phase}{"|"}{.spec.nodeName}{"|"}{range .status.containerStatuses[*]}{.name}{":"}{.restartCount}{":"}{.ready}{":"}{.state.waiting.reason}{":"}{.state.terminated.reason}{","}{end}{"\n"}{end}' > "$TMP_FILE"

FOUND=0

while IFS='|' read -r ns pod phase node statuses; do
  [[ -z "${ns:-}" || -z "${pod:-}" ]] && continue

  problem=0
  summary=()

  # 1. Pod phase check
  if [[ "$phase" != "Running" && "$phase" != "Succeeded" ]]; then
    problem=1
    summary+=("phase=$phase")
  fi

  # 2. Container statuses check
  IFS=',' read -ra containers <<< "$statuses"
  for c in "${containers[@]}"; do
    [[ -z "$c" ]] && continue

    IFS=':' read -r cname restarts ready waiting_reason terminated_reason <<< "$c"

    if [[ "${restarts:-0}" =~ ^[0-9]+$ ]] && (( restarts > 0 )); then
      problem=1
      summary+=("$cname restarts=$restarts")
    fi

    if [[ -n "${waiting_reason:-}" && "${waiting_reason}" != "<no value>" ]]; then
      problem=1
      summary+=("$cname waiting=$waiting_reason")
    fi

    if [[ -n "${terminated_reason:-}" && "${terminated_reason}" != "<no value>" ]]; then
      problem=1
      summary+=("$cname terminated=$terminated_reason")
    fi

    if [[ "${ready:-}" == "false" && "$phase" == "Running" ]]; then
      problem=1
      summary+=("$cname ready=false")
    fi
  done

  if (( problem == 0 )); then
    continue
  fi

  FOUND=1

  echo
  echo "============================================================"
  echo "🔍 Namespace: $ns"
  echo "🔍 Pod:       $pod"
  echo "🔍 Phase:     $phase"
  echo "🔍 Node:      ${node:-<none>}"
  echo "🔍 Problem:   ${summary[*]}"
  echo "============================================================"

  echo
  echo "📄 Pod summary:"
  kubectl get pod "$pod" -n "$ns" -o wide || true

  echo
  echo "📦 Container states:"
  kubectl get pod "$pod" -n "$ns" -o jsonpath='{range .status.containerStatuses[*]}{"- "}{.name}{" | ready="}{.ready}{" | restarts="}{.restartCount}{" | waiting="}{.state.waiting.reason}{" | terminated="}{.state.terminated.reason}{"\n"}{end}' 2>/dev/null || true

  echo
  echo "📢 Recent pod events:"
  kubectl get events -n "$ns" \
    --field-selector involvedObject.name="$pod" \
    --sort-by='.lastTimestamp' 2>/dev/null | tail -n 10 || true

  # Extra diagnostics for Pending pods
  if [[ "$phase" == "Pending" ]]; then
    echo
    echo "🧩 Pending pod diagnostics:"
    kubectl describe pod "$pod" -n "$ns" | sed -n '/Events:/,$p' || true

    echo
    echo "💾 PVC used by this pod:"
    CLAIMS=$(kubectl get pod "$pod" -n "$ns" -o jsonpath='{range .spec.volumes[*]}{.persistentVolumeClaim.claimName}{"\n"}{end}' 2>/dev/null || true)

    if [[ -n "${CLAIMS:-}" ]]; then
      while IFS= read -r claim; do
        [[ -z "$claim" ]] && continue
        echo "--- PVC: $claim"
        kubectl get pvc "$claim" -n "$ns" || true
        kubectl describe pvc "$claim" -n "$ns" | sed -n '/Events:/,$p' || true
        echo
      done <<< "$CLAIMS"
    else
      echo "No PVC claims found for this pod."
    fi
  fi

  # Extra diagnostics for crashing pods
  if printf '%s\n' "${summary[@]}" | grep -Eq 'CrashLoopBackOff|Error|ImagePullBackOff|CreateContainerConfigError|ErrImagePull'; then
    echo
    echo "🪵 Last logs (previous container if available):"
    kubectl logs "$pod" -n "$ns" --all-containers=true --previous --tail=50 2>/dev/null || \
    kubectl logs "$pod" -n "$ns" --all-containers=true --tail=50 2>/dev/null || true
  fi

done < "$TMP_FILE"

echo
if (( FOUND == 0 )); then
  log "No problematic pods found in the cluster 🎉"
else
  warn "Problematic pods were found. Review the diagnostics above."
fi