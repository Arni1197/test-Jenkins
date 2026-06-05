#!/usr/bin/env bash
set -euo pipefail

K="${KUBECTL:-kubectl}"
NS="${1:-prod}"

echo "== After-change check for namespace: $NS =="

echo
echo "== Rollout status =="
for deploy in $($K get deploy -n "$NS" -o jsonpath='{.items[*].metadata.name}'); do
  echo
  echo "Checking deployment/$deploy"
  $K rollout status deployment/"$deploy" -n "$NS" --timeout=120s
done

echo
echo "== Pods =="
$K get pods -n "$NS" -o wide

echo
echo "== Problem pods =="
$K get pods -n "$NS" --no-headers | awk '$3 != "Running" && $3 != "Completed" {print}' || true

echo
echo "== Pods with restarts =="
$K get pods -n "$NS" --no-headers | awk '$4 > 0 {print}' || true

echo
echo "== Recent Warning events =="
$K get events -n "$NS" --field-selector type=Warning --sort-by=.lastTimestamp | tail -50