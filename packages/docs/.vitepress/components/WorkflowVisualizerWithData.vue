<template>
  <WorkflowVisualizer
    v-if="workflows.length > 0"
    :workflows="workflows"
    :show-sidebar="showSidebar"
    :hide-header="hideHeader"
    :initial-workflow="initialWorkflow"
  />
  <div v-else class="loading-message">Loading workflows...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WorkflowVisualizer, {
  type WorkflowDefinition,
} from '@codemcp/workflows-visualizer';
import { AVAILABLE_WORKFLOWS } from '../workflow-manifest.js';

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

// Load workflows from generated manifest
const loadBundledWorkflows = async () => {
  // VitePress uses base path in both dev and production
  const basePath = '/responsible-vibe-mcp/workflows/';

  const workflowList: WorkflowDefinition[] = AVAILABLE_WORKFLOWS.map(
    workflowName => ({
      name: workflowName,
      displayName:
        workflowName.charAt(0).toUpperCase() +
        workflowName.slice(1).replace(/-/g, ' '),
      path: `${basePath}${workflowName}.yaml`,
    })
  );

  workflows.value = workflowList;
};

onMounted(() => {
  loadBundledWorkflows();
});
</script>

<style scoped>
.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #64748b;
  font-style: italic;
}
</style>
