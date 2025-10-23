/**
 * Workflow Configuration Tests
 *
 * Tests for project-level workflow filtering via .vibe/config.yaml
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkflowManager } from '@codemcp/workflows-core';

describe('Workflow Configuration', () => {
  let tempDir: string;
  let workflowManager: WorkflowManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'workflow-config-test-'));
    workflowManager = new WorkflowManager();

    // Create .vibe directory
    mkdirSync(join(tempDir, '.vibe'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Configuration Loading', () => {
    it('should return all workflows when no config exists', () => {
      const workflows =
        workflowManager.getAvailableWorkflowsForProject(tempDir);

      // Should include all predefined workflows (excluding custom since no custom workflow file exists)
      expect(workflows.length).toBeGreaterThan(5);
      expect(workflows.some(w => w.name === 'waterfall')).toBe(true);
      expect(workflows.some(w => w.name === 'epcc')).toBe(true);
      expect(workflows.some(w => w.name === 'bugfix')).toBe(true);
    });

    it('should filter workflows based on enabled_workflows config', () => {
      // Create config file with limited workflows
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  - epcc\n`
      );

      const workflows =
        workflowManager.getAvailableWorkflowsForProject(tempDir);

      expect(workflows).toHaveLength(2);
      expect(workflows.find(w => w.name === 'waterfall')).toBeDefined();
      expect(workflows.find(w => w.name === 'epcc')).toBeDefined();
      expect(workflows.find(w => w.name === 'bugfix')).toBeUndefined();
    });

    it('should include custom workflow when enabled and file exists', () => {
      // Create custom workflow file (copy of minor workflow with custom name)
      const minorWorkflowContent = readFileSync(
        join(__dirname, '..', '..', 'resources', 'workflows', 'minor.yaml'),
        'utf8'
      );
      const customWorkflowContent = minorWorkflowContent.replace(
        "name: 'minor'",
        "name: 'custom'"
      );
      writeFileSync(
        join(tempDir, '.vibe', 'workflow.yaml'),
        customWorkflowContent
      );

      // Create config enabling custom workflow
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  - custom\n`
      );

      const workflows =
        workflowManager.getAvailableWorkflowsForProject(tempDir);

      expect(workflows.length).toBeGreaterThanOrEqual(2);
      expect(workflows.find(w => w.name === 'waterfall')).toBeDefined();
      expect(workflows.find(w => w.name === 'custom')).toBeDefined();
    });

    it('should exclude custom workflow when enabled but file does not exist', () => {
      // Create config enabling custom workflow but no custom workflow file
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  - custom\n`
      );

      const workflows =
        workflowManager.getAvailableWorkflowsForProject(tempDir);

      expect(workflows).toHaveLength(1);
      expect(workflows.find(w => w.name === 'waterfall')).toBeDefined();
      expect(workflows.find(w => w.name === 'custom')).toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid workflow names', () => {
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  - nonexistent_workflow\n`
      );

      expect(() => {
        workflowManager.getAvailableWorkflowsForProject(tempDir);
      }).toThrow(/Invalid workflow 'nonexistent_workflow'/);
    });

    it('should throw error for empty enabled_workflows array', () => {
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows: []\n`
      );

      expect(() => {
        workflowManager.getAvailableWorkflowsForProject(tempDir);
      }).toThrow(/enabled_workflows cannot be empty/);
    });

    it('should throw error for malformed YAML', () => {
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  invalid yaml: [unclosed`
      );

      expect(() => {
        workflowManager.getAvailableWorkflowsForProject(tempDir);
      }).toThrow(/Invalid YAML in config file/);
    });

    it('should throw error for non-array enabled_workflows', () => {
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows: "not an array"\n`
      );

      expect(() => {
        workflowManager.getAvailableWorkflowsForProject(tempDir);
      }).toThrow(/enabled_workflows must be an array/);
    });

    it('should throw error for non-string workflow names', () => {
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - waterfall\n  - 123\n`
      );

      expect(() => {
        workflowManager.getAvailableWorkflowsForProject(tempDir);
      }).toThrow(/all workflow names must be non-empty strings/);
    });
  });
});
