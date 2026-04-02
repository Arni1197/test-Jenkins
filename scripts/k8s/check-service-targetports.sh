#!/usr/bin/env bash
set -euo pipefail

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl get svc -A -o json > "$TMP_DIR/svc.json"
kubectl get pods -A -o json > "$TMP_DIR/pods.json"

python3 - <<'PY'
import json
from pathlib import Path

tmp = Path("'"$TMP_DIR"'")
svc_data = json.loads((tmp / "svc.json").read_text())
pod_data = json.loads((tmp / "pods.json").read_text())

pods_by_ns = {}
for pod in pod_data["items"]:
    ns = pod["metadata"]["namespace"]
    pods_by_ns.setdefault(ns, []).append(pod)

def labels_match(selector, labels):
    if not selector:
        return False
    for k, v in selector.items():
        if labels.get(k) != v:
            return False
    return True

for svc in svc_data["items"]:
    ns = svc["metadata"]["namespace"]
    name = svc["metadata"]["name"]
    selector = svc["spec"].get("selector", {})
    ports = svc["spec"].get("ports", [])

    matched_pods = []
    for pod in pods_by_ns.get(ns, []):
        labels = pod["metadata"].get("labels", {})
        if labels_match(selector, labels):
            matched_pods.append(pod)

    print(f"\n=== {ns}/{name} ===")
    if not selector:
        print("No selector (possibly ExternalName/manual Endpoints/headless special case)")
        continue

    if not matched_pods:
        print("No matching pods found")
        continue

    for port in ports:
        svc_port = port.get("port")
        target_port = port.get("targetPort")
        port_name = port.get("name")

        print(f"Service port={svc_port}, targetPort={target_port}, name={port_name}")

        found = False
        for pod in matched_pods:
            pod_name = pod["metadata"]["name"]
            for container in pod["spec"].get("containers", []):
                for cport in container.get("ports", []) or []:
                    container_port = cport.get("containerPort")
                    container_port_name = cport.get("name")

                    ok = False
                    if isinstance(target_port, int) and container_port == target_port:
                        ok = True
                    elif isinstance(target_port, str) and container_port_name == target_port:
                        ok = True

                    if ok:
                        found = True
                        print(
                            f"  OK -> pod={pod_name}, container={container['name']}, "
                            f"containerPort={container_port}, portName={container_port_name}"
                        )

        if not found:
            print("  WARN -> no matching containerPort found in selected pods")
PY