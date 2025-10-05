import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ListWorkflowsHandler } from '../../packages/mcp-server/src/tool-handlers/list-workflows.js';
import { WorkflowManager } from '@responsible-vibe/core';

describe('List Workflows Filtering', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.VIBE_WORKFLOW_DOMAINS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.VIBE_WORKFLOW_DOMAINS = originalEnv;
    } else {
      delete process.env.VIBE_WORKFLOW_DOMAINS;
    }
  });

  it('should return only loaded workflows by default', async () => {
    process.env.VIBE_WORKFLOW_DOMAINS = 'code';

    const handler = new ListWorkflowsHandler();
    const workflowManager = new WorkflowManager();

    const context = {
      workflowManager,
      projectPath: process.cwd(),
    } as { workflowManager: WorkflowManager; projectPath: string };

    const result = await handler.executeHandler({}, context);

    // Should only include code workflows
    const hasCodeWorkflows = result.workflows.some(
      w => w.name === 'waterfall' || w.name === 'epcc'
    );
    const hasOfficeWorkflows = result.workflows.some(w => w.name === 'posts');

    expect(hasCodeWorkflows).toBe(true);
    expect(hasOfficeWorkflows).toBe(false);
  });

  it('should return all workflows when include_unloaded is true', async () => {
    process.env.VIBE_WORKFLOW_DOMAINS = 'code';

    const handler = new ListWorkflowsHandler();
    const workflowManager = new WorkflowManager();

    const context = {
      workflowManager,
      projectPath: process.cwd(),
    } as { workflowManager: WorkflowManager; projectPath: string };

    const result = await handler.executeHandler(
      { include_unloaded: true },
      context
    );

    // Should include workflows from all domains
    const hasCodeWorkflows = result.workflows.some(
      w => w.name === 'waterfall' || w.name === 'epcc'
    );
    const hasOfficeWorkflows = result.workflows.some(w => w.name === 'posts');

    expect(hasCodeWorkflows).toBe(true);
    expect(hasOfficeWorkflows).toBe(true);
  });
});
