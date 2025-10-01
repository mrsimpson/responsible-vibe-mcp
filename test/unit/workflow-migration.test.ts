import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowManager } from '../../src/workflow-manager.js';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('Workflow Migration', () => {
  let testProjectPath: string;

  beforeEach(() => {
    testProjectPath = fs.mkdtempSync(
      path.join(tmpdir(), 'workflow-migration-test-')
    );
  });

  afterEach(() => {
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  it('should migrate workflow.yaml to workflows/custom.yaml', () => {
    // Create .vibe directory and legacy workflow file
    const vibeDir = path.join(testProjectPath, '.vibe');
    fs.mkdirSync(vibeDir, { recursive: true });

    const legacyWorkflow = `
name: my-custom-workflow
description: 'Legacy custom workflow'
initial_state: start
states:
  start:
    description: 'Start phase'
    default_instructions: 'Start instructions'
    transitions:
      - target: end
        condition: 'always'
  end:
    description: 'End phase'
    default_instructions: 'End instructions'
    transitions: []
`;

    const legacyPath = path.join(vibeDir, 'workflow.yaml');
    fs.writeFileSync(legacyPath, legacyWorkflow);

    const manager = new WorkflowManager();

    // Load project workflows (this should trigger migration)
    manager.loadProjectWorkflows(testProjectPath);

    // Check that legacy file was moved
    expect(fs.existsSync(legacyPath)).toBe(false);

    // Check that new file exists
    const newPath = path.join(vibeDir, 'workflows', 'custom.yaml');
    expect(fs.existsSync(newPath)).toBe(true);

    // Check content is preserved
    const newContent = fs.readFileSync(newPath, 'utf8');
    expect(newContent).toContain('my-custom-workflow');
    expect(newContent).toContain('Legacy custom workflow');
  });

  it('should migrate workflow.yml to workflows/custom.yaml', () => {
    // Create .vibe directory and legacy workflow file with .yml extension
    const vibeDir = path.join(testProjectPath, '.vibe');
    fs.mkdirSync(vibeDir, { recursive: true });

    const legacyWorkflow = `
name: yml-workflow
description: 'YML extension workflow'
initial_state: start
states:
  start:
    description: 'Start phase'
    default_instructions: 'Start instructions'
    transitions:
      - target: end
        condition: 'always'
  end:
    description: 'End phase'
    default_instructions: 'End instructions'
    transitions: []
`;

    const legacyPath = path.join(vibeDir, 'workflow.yml');
    fs.writeFileSync(legacyPath, legacyWorkflow);

    const manager = new WorkflowManager();

    // Load project workflows (this should trigger migration)
    manager.loadProjectWorkflows(testProjectPath);

    // Check that legacy file was moved
    expect(fs.existsSync(legacyPath)).toBe(false);

    // Check that new file exists
    const newPath = path.join(vibeDir, 'workflows', 'custom.yaml');
    expect(fs.existsSync(newPath)).toBe(true);

    // Check content is preserved
    const newContent = fs.readFileSync(newPath, 'utf8');
    expect(newContent).toContain('yml-workflow');
  });

  it('should not migrate if target file already exists', () => {
    // Create .vibe directory and both legacy and new workflow files
    const vibeDir = path.join(testProjectPath, '.vibe');
    const workflowsDir = path.join(vibeDir, 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    const legacyWorkflow = 'name: legacy\ndescription: Legacy';
    const newWorkflow = 'name: existing\ndescription: Existing';

    const legacyPath = path.join(vibeDir, 'workflow.yaml');
    const newPath = path.join(workflowsDir, 'custom.yaml');

    fs.writeFileSync(legacyPath, legacyWorkflow);
    fs.writeFileSync(newPath, newWorkflow);

    const manager = new WorkflowManager();

    // Load project workflows (should not migrate because target exists)
    manager.loadProjectWorkflows(testProjectPath);

    // Check that legacy file still exists
    expect(fs.existsSync(legacyPath)).toBe(true);

    // Check that new file is unchanged
    const newContent = fs.readFileSync(newPath, 'utf8');
    expect(newContent).toContain('existing');
    expect(newContent).not.toContain('legacy');
  });

  it('should handle migration errors gracefully', () => {
    // Create .vibe directory and legacy workflow file
    const vibeDir = path.join(testProjectPath, '.vibe');
    fs.mkdirSync(vibeDir, { recursive: true });

    const legacyPath = path.join(vibeDir, 'workflow.yaml');
    fs.writeFileSync(legacyPath, 'name: test');

    // Make the .vibe directory read-only to cause migration failure
    fs.chmodSync(vibeDir, 0o444);

    const manager = new WorkflowManager();

    // Should not throw error even if migration fails
    expect(() => {
      manager.loadProjectWorkflows(testProjectPath);
    }).not.toThrow();

    // Restore permissions for cleanup
    fs.chmodSync(vibeDir, 0o755);
  });
});
