import { workflowList } from './workflow-list';

// Bundled workflows configuration - imported from generated list
const bundledWorkflows = workflowList;

export function getBundledWorkflowNames(): string[] {
  return bundledWorkflows;
}

export function getBundledWorkflow(name: string): string {
  if (!bundledWorkflows.includes(name)) {
    throw new Error(`Workflow '${name}' not found in bundled workflows`);
  }
  return `/workflows/${name}.yaml`;
}

export function getBundledWorkflowMetadata(name?: string) {
  if (name) {
    if (!bundledWorkflows.includes(name)) {
      throw new Error(`Workflow '${name}' not found in bundled workflows`);
    }
    return {
      name,
      path: `/workflows/${name}.yaml`,
      bundled: true,
    };
  }
  return bundledWorkflows.map(name => ({
    name,
    path: `/workflows/${name}.yaml`,
    bundled: true,
  }));
}

export default bundledWorkflows;
