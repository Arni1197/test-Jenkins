#!/usr/bin/env bash
set -euo pipefail

NS="${1:-prod}"
POD="${2:-}"

if [ -z "$POD" ]; then
  echo "Usage: ./k8s-pod-info.sh <namespace> <pod-name>"
  echo
  echo "Example:"
  echo "  ./k8s-pod-info.sh prod catalog-service-xxx"
  exit 1
fi

echo "== Pod summary =="
kubectl get pod "$POD" -n "$NS" -o wide

echo
echo "== Node =="
kubectl get pod "$POD" -n "$NS" -o jsonpath='{.spec.nodeName}{"\n"}'

echo
echo "== Status / IP =="
kubectl get pod "$POD" -n "$NS" \
  -o jsonpath='Phase: {.status.phase}{"\n"}PodIP: {.status.podIP}{"\n"}HostIP: {.status.hostIP}{"\n"}'

echo
echo "== Containers =="
kubectl get pod "$POD" -n "$NS" \
  -o jsonpath='{range .spec.containers[*]}Name: {.name}{" | Image: "}{.image}{"\n"}{end}'

echo
echo "== Container readiness / restarts =="
kubectl get pod "$POD" -n "$NS" \
  -o jsonpath='{range .status.containerStatuses[*]}Name: {.name}{" | Ready: "}{.ready}{" | Restarts: "}{.restartCount}{" | ImageID: "}{.imageID}{"\n"}{end}'

echo
echo "== Owner =="
kubectl get pod "$POD" -n "$NS" \
  -o jsonpath='{range .metadata.ownerReferences[*]}Kind: {.kind}{" | Name: "}{.name}{"\n"}{end}'

echo
echo "== Labels =="
kubectl get pod "$POD" -n "$NS" --show-labels

echo
echo "== Recent pod events =="
kubectl describe pod "$POD" -n "$NS" | sed -n '/Events:/,$p'