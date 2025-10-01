import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowManager } from '../../src/workflow-manager.js';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('Workflow Enum Generation', () => {
  let testProjectPath: string;
  let manager: WorkflowManager;

  beforeEach(() => {
    testProjectPath = fs.mkdtempSync(
      path.join(tmpdir(), 'workflow-enum-test-')
    );
    manager = new WorkflowManager();
  });

  afterEach(() => {
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  it('should include predefined workflows in enum', () => {
    const workflowNames = manager.getWorkflowNames();

    // Should include common predefined workflows
    expect(workflowNames).toContain('waterfall');
    expect(workflowNames).toContain('epcc');
    expect(workflowNames).toContain('bugfix');
  });

  it('should include project workflows in enum after loading', () => {
    // Create a project workflow
    const workflowsDir = path.join(testProjectPath, '.vibe', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Copy minor workflow and customize it
    const minorPath = path.join(
      __dirname,
      '..',
      '..',
      'resources',
      'workflows',
      'minor.yaml'
    );
    const originalContent = fs.readFileSync(minorPath, 'utf8');
    const customContent = originalContent
      .replace("name: 'minor'", "name: 'my-custom-workflow'")
      .replace(/description: .*/, "description: 'Custom workflow for testing'");

    fs.writeFileSync(path.join(workflowsDir, 'custom.yaml'), customContent);

    // Load project workflows
    manager.loadProjectWorkflows(testProjectPath);

    const workflowNames = manager.getWorkflowNames();

    // Should include both predefined and project workflows
    expect(workflowNames).toContain('waterfall'); // predefined
    expect(workflowNames).toContain('my-custom-workflow'); // project
  });

  it('should not duplicate workflow names when project overrides predefined', () => {
    // Create a project workflow with same name as predefined
    const workflowsDir = path.join(testProjectPath, '.vibe', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Copy minor workflow but keep the same name
    const minorPath = path.join(
      __dirname,
      '..',
      '..',
      'resources',
      'workflows',
      'minor.yaml'
    );
    const originalContent = fs.readFileSync(minorPath, 'utf8');

    fs.writeFileSync(
      path.join(workflowsDir, 'minor-override.yaml'),
      originalContent
    );

    // Load project workflows
    manager.loadProjectWorkflows(testProjectPath);

    const workflowNames = manager.getWorkflowNames();

    // Should not have duplicates
    const minorCount = workflowNames.filter(name => name === 'minor').length;
    expect(minorCount).toBe(1);
  });
});
