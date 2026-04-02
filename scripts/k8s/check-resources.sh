#!/usr/bin/env bash
set -euo pipefail

echo "===== POD RESOURCE REQUESTS / LIMITS ====="
kubectl get pods -A -o jsonpath='
{range .items[*]}
{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}
{range .spec.containers[*]}
  {"  container="}{.name}{" request.cpu="}{.resources.requests.cpu}{" request.mem="}{.resources.requests.memory}{" limit.cpu="}{.resources.limits.cpu}{" limit.mem="}{.resources.limits.memory}{"\n"}
{end}
{"\n"}
{end}
'