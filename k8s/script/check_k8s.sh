#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="default"
ACTION="pods"

log() {
  echo "[INFO] $1"
}

error() {
  echo "[ERROR] $1" >&2
}

show_help() {
  cat <<EOF
Usage:
  $0 -a <action> [-n <namespace>]

Actions:
  nodes        Show cluster nodes
  pods         Show pods in namespace
  pvc          Show PVC in namespace
  all          Show pods and PVC in namespace

Examples:
  $0 -a nodes
  $0 -a pods -n vault
  $0 -a pvc -n vault
  $0 -a all -n kube-prometheus-stack
EOF
}

check_cluster_access() {
  if ! kubectl get nodes >/dev/null 2>&1; then
    error "Kubernetes cluster is not accessible"
    exit 1
  fi
}

show_nodes() {
  log "Showing cluster nodes"
  kubectl get nodes -o wide
}

show_pods() {
  log "Showing pods in namespace: $NAMESPACE"
  kubectl get pods -n "$NAMESPACE" -o wide
}

show_pvc() {
  log "Showing PVC in namespace: $NAMESPACE"
  kubectl get pvc -n "$NAMESPACE"
}

while getopts ":a:n:h" opt; do
  case "$opt" in
    a)
      ACTION="$OPTARG"
      ;;
    n)
      NAMESPACE="$OPTARG"
      ;;
    h)
      show_help
      exit 0
      ;;
    :)
      error "Option -$OPTARG requires a value"
      show_help
      exit 1
      ;;
    \?)
      error "Unknown option: -$OPTARG"
      show_help
      exit 1
      ;;
  esac
done

check_cluster_access

case "$ACTION" in
  nodes)
    show_nodes
    ;;
  pods)
    show_pods
    ;;
  pvc)
    show_pvc
    ;;
  all)
    show_pods
    echo
    show_pvc
    ;;
  *)
    error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac