<template>
  <WorkflowVisualizer 
    :workflows="workflows" 
    :show-sidebar="showSidebar"
    :hide-header="hideHeader"
    :initial-workflow="initialWorkflow"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WorkflowVisualizer, { type WorkflowDefinition } from '@responsible-vibe/visualizer';

interface Props {
  showSidebar?: boolean;
  hideHeader?: boolean;
  initialWorkflow?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  hideHeader: false,
  initialWorkflow: '',
});

const workflows = ref<WorkflowDefinition[]>([]);

// Load bundled workflows from the public directory
const loadBundledWorkflows = async () => {
  const workflowNames = ['waterfall', 'epcc', 'tdd', 'bugfix', 'minor', 'greenfield'];
  const workflowList: WorkflowDefinition[] = [];
  
  for (const workflowName of workflowNames) {
    workflowList.push({
      name: workflowName,
      displayName: workflowName.charAt(0).toUpperCase() + workflowName.slice(1),
      path: `/responsible-vibe-mcp/workflows/${workflowName}.yaml`
    });
  }
  
  workflows.value = workflowList;
};

onMounted(() => {
  loadBundledWorkflows();
});
</script>
