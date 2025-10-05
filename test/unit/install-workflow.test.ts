import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InstallWorkflowHandler } from '../../packages/mcp-server/src/tool-handlers/install-workflow.js';
import { WorkflowManager } from '@responsible-vibe/core';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('Install Workflow', () => {
  let testProjectPath: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.VIBE_WORKFLOW_DOMAINS;
    testProjectPath = fs.mkdtempSync(
      path.join(tmpdir(), 'install-workflow-test-')
    );
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.VIBE_WORKFLOW_DOMAINS = originalEnv;
    } else {
      delete process.env.VIBE_WORKFLOW_DOMAINS;
    }

    // Clean up test directory
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  it('should install workflow and make it immediately available', async () => {
    process.env.VIBE_WORKFLOW_DOMAINS = 'code';

    const handler = new InstallWorkflowHandler();
    const workflowManager = new WorkflowManager();
    const context = { workflowManager, projectPath: testProjectPath } as {
      workflowManager: WorkflowManager;
      projectPath: string;
    };

    // Before installation - posts should not be available (office domain)
    let workflows =
      workflowManager.getAvailableWorkflowsForProject(testProjectPath);
    expect(workflows.some(w => w.name === 'posts')).toBe(false);

    // Install posts workflow
    const result = await handler.executeHandler({ source: 'posts' }, context);
    expect(result.success).toBe(true);

    // After installation - posts should be available (project workflows ignore domain filtering)
    workflows =
      workflowManager.getAvailableWorkflowsForProject(testProjectPath);
    expect(workflows.some(w => w.name === 'posts')).toBe(true);
  });

  it('should prevent overwriting existing workflows', async () => {
    const handler = new InstallWorkflowHandler();
    const workflowManager = new WorkflowManager();
    const context = { workflowManager, projectPath: testProjectPath } as {
      workflowManager: WorkflowManager;
      projectPath: string;
    };

    // Install workflow first time
    const result1 = await handler.executeHandler({ source: 'posts' }, context);
    expect(result1.success).toBe(true);

    // Try to install same workflow again
    const result2 = await handler.executeHandler({ source: 'posts' }, context);
    expect(result2.success).toBe(false);
    expect(result2.message).toContain('already exists');
  });

  it('should install with custom name', async () => {
    const handler = new InstallWorkflowHandler();
    const workflowManager = new WorkflowManager();
    const context = { workflowManager, projectPath: testProjectPath } as {
      workflowManager: WorkflowManager;
      projectPath: string;
    };

    // Install with custom name
    const result = await handler.executeHandler(
      {
        source: 'posts',
        name: 'my-posts',
      },
      context
    );

    expect(result.success).toBe(true);
    expect(result.installedPath).toContain('my-posts.yaml');

    // Check file exists with custom name
    const customFile = path.join(
      testProjectPath,
      '.vibe',
      'workflows',
      'my-posts.yaml'
    );
    expect(fs.existsSync(customFile)).toBe(true);
  });

  it('should handle non-existent workflow', async () => {
    const handler = new InstallWorkflowHandler();
    const workflowManager = new WorkflowManager();
    const context = { workflowManager, projectPath: testProjectPath } as {
      workflowManager: WorkflowManager;
      projectPath: string;
    };

    const result = await handler.executeHandler(
      { source: 'nonexistent' },
      context
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should create .vibe/workflows directory if it does not exist', async () => {
    const handler = new InstallWorkflowHandler();
    const workflowManager = new WorkflowManager();
    const context = { workflowManager, projectPath: testProjectPath } as {
      workflowManager: WorkflowManager;
      projectPath: string;
    };

    // Ensure directory doesn't exist
    const workflowsDir = path.join(testProjectPath, '.vibe', 'workflows');
    expect(fs.existsSync(workflowsDir)).toBe(false);

    // Install workflow
    const result = await handler.executeHandler({ source: 'posts' }, context);
    expect(result.success).toBe(true);

    // Directory should now exist
    expect(fs.existsSync(workflowsDir)).toBe(true);
  });
});
