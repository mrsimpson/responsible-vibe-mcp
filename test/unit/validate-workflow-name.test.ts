import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowManager } from '@responsible-vibe/core';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('validateWorkflowName', () => {
  let testProjectPath: string;
  let manager: WorkflowManager;

  beforeEach(() => {
    testProjectPath = fs.mkdtempSync(
      path.join(tmpdir(), 'validate-workflow-test-')
    );
    manager = new WorkflowManager();
  });

  afterEach(() => {
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  it('should validate predefined workflows', () => {
    expect(manager.validateWorkflowName('waterfall', testProjectPath)).toBe(
      true
    );
    expect(manager.validateWorkflowName('epcc', testProjectPath)).toBe(true);
    expect(manager.validateWorkflowName('bugfix', testProjectPath)).toBe(true);
  });

  it('should validate project workflows', () => {
    // Create a project workflow using valid format from existing workflow
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
      .replace("name: 'minor'", "name: 'my-project-workflow'")
      .replace(/description: .*/, "description: 'Project specific workflow'");

    fs.writeFileSync(path.join(workflowsDir, 'project.yaml'), customContent);

    // Should validate the project workflow
    expect(
      manager.validateWorkflowName('my-project-workflow', testProjectPath)
    ).toBe(true);
  });

  it('should reject invalid workflow names', () => {
    expect(manager.validateWorkflowName('nonexistent', testProjectPath)).toBe(
      false
    );
    expect(
      manager.validateWorkflowName('invalid-workflow', testProjectPath)
    ).toBe(false);
  });

  it('should validate "custom" workflow if it exists as project workflow', () => {
    // Create a project workflow named "custom"
    const workflowsDir = path.join(testProjectPath, '.vibe', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Copy minor workflow and name it "custom"
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
      .replace("name: 'minor'", "name: 'custom'")
      .replace(/description: .*/, "description: 'Custom workflow'");

    fs.writeFileSync(path.join(workflowsDir, 'custom.yaml'), customContent);

    // Should validate the "custom" workflow as a normal project workflow
    expect(manager.validateWorkflowName('custom', testProjectPath)).toBe(true);
  });

  it('should validate "custom" workflow if it exists as project workflow', () => {
    // Create a project workflow named "custom"
    const workflowsDir = path.join(testProjectPath, '.vibe', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Copy minor workflow and name it "custom"
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
      .replace("name: 'minor'", "name: 'custom'")
      .replace(/description: .*/, "description: 'Custom workflow'");

    fs.writeFileSync(path.join(workflowsDir, 'custom.yaml'), customContent);

    // Should validate the "custom" workflow as a normal project workflow
    expect(manager.validateWorkflowName('custom', testProjectPath)).toBe(true);
  });

  it('should validate project workflows after migration', () => {
    // Create legacy workflow file using valid format
    const vibeDir = path.join(testProjectPath, '.vibe');
    fs.mkdirSync(vibeDir, { recursive: true });

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
    const legacyContent = originalContent
      .replace("name: 'minor'", "name: 'migrated-workflow'")
      .replace(/description: .*/, "description: 'Migrated workflow'");

    fs.writeFileSync(path.join(vibeDir, 'workflow.yaml'), legacyContent);

    // Should validate the migrated workflow (migration happens during validation)
    expect(
      manager.validateWorkflowName('migrated-workflow', testProjectPath)
    ).toBe(true);

    // Legacy file should be gone
    expect(fs.existsSync(path.join(vibeDir, 'workflow.yaml'))).toBe(false);

    // New file should exist
    expect(fs.existsSync(path.join(vibeDir, 'workflows', 'custom.yaml'))).toBe(
      true
    );
  });
});
