#!/usr/bin/env bash
set -euo pipefail

K="${KUBECTL:-kubectl}"
NS="${1:-prod}"

echo "== Image digest check for namespace: $NS =="

$K get pods -n "$NS" \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{range .spec.containers[*]}{"  spec image: "}{.image}{"\n"}{end}{range .status.containerStatuses[*]}{"  running imageID: "}{.imageID}{"\n"}{end}{"\n"}{end}'