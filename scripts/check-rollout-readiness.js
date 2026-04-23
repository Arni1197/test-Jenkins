const { execFileSync } = require('node:child_process');

const namespace = process.env.KUBE_NAMESPACE || 'dev';
const deployments = (process.env.KUBE_DEPLOYMENTS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const statefulsets = (process.env.KUBE_STATEFULSETS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

function runKubectl(args) {
  console.log(`\n> kubectl ${args.join(' ')}`);
  execFileSync('kubectl', args, { stdio: 'inherit' });
}

function checkWorkloads(kind, names) {
  for (const name of names) {
    runKubectl(['-n', namespace, 'rollout', 'status', `${kind}/${name}`, '--timeout=180s']);
  }
}

function main() {
  if (deployments.length === 0 && statefulsets.length === 0) {
    throw new Error(
      'No workloads configured. Set KUBE_DEPLOYMENTS and/or KUBE_STATEFULSETS environment variables.',
    );
  }

  console.log(`Namespace: ${namespace}`);
  console.log(`Deployments: ${deployments.join(', ') || '(none)'}`);
  console.log(`StatefulSets: ${statefulsets.join(', ') || '(none)'}`);

  checkWorkloads('deployment', deployments);
  checkWorkloads('statefulset', statefulsets);

  console.log('\n> kubectl get pods');
  runKubectl(['-n', namespace, 'get', 'pods', '-o', 'wide']);

  console.log('\nRollout/readiness check passed.');
}

try {
  main();
} catch (error) {
  console.error('\nRollout/readiness check failed.');
  console.error(error.message || error);
  process.exit(1);
}