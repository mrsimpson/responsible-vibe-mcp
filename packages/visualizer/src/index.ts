export { default } from './WorkflowVisualizer.vue';
export { default as WorkflowVisualizer } from './WorkflowVisualizer.vue';

// Export types for consumers
export interface WorkflowDefinition {
  name: string;
  displayName?: string;
  domain?: string;
  path: string;
}

// Export utility classes (though these may not be needed by consumers anymore)
export { WorkflowLoader } from './services/WorkflowLoader';
export { FileUploadHandler } from './services/FileUploadHandler';
export { ErrorHandler } from './utils/ErrorHandler';
export { PlantUMLRenderer } from './visualization/PlantUMLRenderer';
export { getRequiredElement } from './utils/DomHelpers';
