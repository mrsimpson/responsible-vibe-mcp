/**
 * Basic tests for BeadsPlugin implementation
 */

import { BeadsPlugin } from '../../src/plugin-system/beads-plugin.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BeadsPlugin', () => {
  let plugin: BeadsPlugin;
  const mockProjectPath = '/test/project/path';

  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv('TASK_BACKEND', 'beads');
    plugin = new BeadsPlugin({ projectPath: mockProjectPath });
  });

  describe('Basic Interface Implementation', () => {
    it('should return correct name', () => {
      expect(plugin.getName()).toBe('BeadsPlugin');
    });

    it('should return correct sequence', () => {
      expect(plugin.getSequence()).toBe(100);
    });

    it('should be enabled when TASK_BACKEND is beads', () => {
      expect(plugin.isEnabled()).toBe(true);
    });

    it('should not be enabled when TASK_BACKEND is not beads', () => {
      vi.stubEnv('TASK_BACKEND', 'none');
      const testPlugin = new BeadsPlugin({ projectPath: mockProjectPath });
      expect(testPlugin.isEnabled()).toBe(false);
    });

    it('should provide required hooks', () => {
      const hooks = plugin.getHooks();
      expect(hooks.afterStartDevelopment).toBeDefined();
      expect(hooks.beforePhaseTransition).toBeDefined();
      expect(hooks.afterPlanFileCreated).toBeDefined();
    });
  });

  describe('Hook Implementation', () => {
    const mockContext = {
      conversationId: 'test-conversation',
      planFilePath: '/test/plan.md',
      currentPhase: 'test-phase',
      workflow: 'test-workflow',
      projectPath: mockProjectPath,
      gitBranch: 'test-branch',
    };

    it('should handle afterStartDevelopment hook without errors', async () => {
      const hooks = plugin.getHooks();
      const result = hooks.afterStartDevelopment;
      expect(result).toBeDefined();

      // This should not throw because it's just logging a warning
      // about architectural limitations
      if (result) {
        await expect(
          result(
            mockContext,
            { workflow: 'test-workflow', commit_behaviour: 'end' },
            {
              conversationId: 'test',
              planFilePath: '/test/plan.md',
              phase: 'test-phase',
              workflow: 'test-workflow',
            }
          )
        ).resolves.not.toThrow();
      }
    });

    it('should handle afterPlanFileCreated hook', async () => {
      const hooks = plugin.getHooks();
      const result = hooks.afterPlanFileCreated;
      expect(result).toBeDefined();

      if (result) {
        const content = 'test plan content';
        const processedContent = await result(
          mockContext,
          '/test/plan.md',
          content
        );
        expect(processedContent).toBe(content); // Should return unchanged
      }
    });
  });
});
