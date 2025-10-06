import { describe, it, expect } from 'vitest';
import { WorkflowManager } from '@responsible-vibe/core';

describe('Workflow Prioritization', () => {
  it('should prioritize project workflows over predefined ones in getWorkflow method', () => {
    const manager = new WorkflowManager();

    // Get original waterfall workflow
    const originalWaterfall = manager.getWorkflow('waterfall');
    expect(originalWaterfall?.name).toBe('waterfall');

    // Simulate adding a project workflow with same name
    // Access private property for testing (this simulates successful loading)
    const projectWorkflows = (manager as unknown).projectWorkflows;
    const workflowInfos = (manager as unknown).workflowInfos;

    const customWorkflow = {
      name: 'custom-waterfall',
      description: 'Custom override',
      initial_state: 'custom-start',
      states: { 'custom-start': { description: 'test' } },
    };

    projectWorkflows.set('waterfall', customWorkflow);
    workflowInfos.set('waterfall', {
      name: 'waterfall',
      displayName: 'custom-waterfall',
      description: 'Custom override',
      initialState: 'custom-start',
      phases: ['custom-start'],
    });

    // Now getWorkflow should return the project workflow
    const prioritizedWorkflow = manager.getWorkflow('waterfall');
    expect(prioritizedWorkflow?.name).toBe('custom-waterfall');
    expect(prioritizedWorkflow?.description).toBe('Custom override');
  });
});
