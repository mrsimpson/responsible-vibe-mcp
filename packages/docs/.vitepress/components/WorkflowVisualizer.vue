<script setup lang="ts">
import WorkflowVisualizer from '@responsible-vibe/visualizer';

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
</script>

<template>
  <WorkflowVisualizer 
    :show-sidebar="props.showSidebar" 
    :hide-header="props.hideHeader" 
    :initial-workflow="props.initialWorkflow" 
  />
</template>
