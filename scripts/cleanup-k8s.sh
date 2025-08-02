#!/bin/bash
# K8s Cleanup Script - Separate from CI/CD to keep it clean

echo "=== Starting K8s Cleanup ==="

# Basic containerd cleanup
echo "Running containerd prune..."
microk8s ctr content prune || true

# Clean registry garbage (if using registry)
if microk8s status --addon registry &>/dev/null; then
  echo "Cleaning registry..."
  registry_pod=$(kubectl --namespace="container-registry" get pods --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}' 2>/dev/null | head -1)
  if [ ! -z "$registry_pod" ]; then
    kubectl exec --namespace="container-registry" $registry_pod -- /bin/registry garbage-collect /etc/docker/registry/config.yml || true
  fi
fi

# Remove evicted pods
echo "Removing evicted pods..."
kubectl get pods --all-namespaces | grep Evicted | awk '{print $2 " --namespace=" $1}' | xargs -r kubectl delete pod || true

# Clean old replica sets
echo "Cleaning old replica sets..."
kubectl get replicaset --all-namespaces | grep '0         0         0' | awk '{print $2 " --namespace=" $1}' | head -10 | xargs -r kubectl delete replicaset || true

echo "=== Cleanup completed ==="