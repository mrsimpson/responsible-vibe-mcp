/**
 * Tests for Plugin Error Handling and Graceful Degradation
 *
 * Verifies that the plugin system handles errors gracefully:
 * - Plugin failures don't crash the core application
 * - Non-critical plugin errors allow graceful degradation
 * - Validation errors (beforePhaseTransition) are always re-thrown
 */

import { describe, it, expect, vi } from 'vitest';
import { PluginRegistry } from '../../src/plugin-system/plugin-registry.js';
import type { IPlugin } from '../../src/plugin-system/plugin-interfaces.js';

const createMockContext = () => ({
  conversationId: 'test',
  planFilePath: '/test/plan.md',
  projectPath: '/test',
  currentPhase: 'explore',
  workflow: 'epcc',
  gitBranch: 'main',
});

describe('Plugin Error Handling and Graceful Degradation', () => {
  describe('Non-critical hook error handling', () => {
    it('should continue execution when afterStartDevelopment hook fails', async () => {
      const registry = new PluginRegistry();

      // Register first plugin that throws
      const failingPlugin: IPlugin = {
        getName: () => 'FailingPlugin',
        getSequence: () => 1,
        isEnabled: () => true,
        getHooks: () => ({
          afterStartDevelopment: vi
            .fn()
            .mockRejectedValue(new Error('Beads backend unavailable')),
        }),
      };

      // Register second plugin that succeeds
      const successHookSpy = vi.fn().mockResolvedValue(undefined);
      const successPlugin: IPlugin = {
        getName: () => 'SuccessPlugin',
        getSequence: () => 2,
        isEnabled: () => true,
        getHooks: () => ({
          afterStartDevelopment: successHookSpy,
        }),
      };

      registry.registerPlugin(failingPlugin);
      registry.registerPlugin(successPlugin);

      // Execute hook - should NOT throw despite first plugin failure
      const result = await registry.executeHook(
        'afterStartDevelopment',
        createMockContext(),
        { workflow: 'epcc', commit_behaviour: 'end' },
        {
          conversationId: 'test',
          planFilePath: '/test/plan.md',
          phase: 'explore',
          workflow: 'epcc',
        }
      );

      // Should reach here without throwing
      expect(result).toBeUndefined();
      expect(successHookSpy).toHaveBeenCalled();
    });

    it('should continue execution when afterPlanFileCreated hook fails', async () => {
      const registry = new PluginRegistry();

      const failingPlugin: IPlugin = {
        getName: () => 'FailingPlugin',
        getSequence: () => 1,
        isEnabled: () => true,
        getHooks: () => ({
          afterPlanFileCreated: vi
            .fn()
            .mockRejectedValue(new Error('Plan file update failed')),
        }),
      };

      registry.registerPlugin(failingPlugin);

      // Should not throw despite plugin error
      const result = await registry.executeHook(
        'afterPlanFileCreated',
        createMockContext(),
        '/test/plan.md',
        'initial content'
      );

      expect(result).toBeUndefined();
    });
  });

  describe('Validation hook error handling', () => {
    it('should re-throw validation errors from beforePhaseTransition', async () => {
      const registry = new PluginRegistry();

      const validationPlugin: IPlugin = {
        getName: () => 'ValidationPlugin',
        getSequence: () => 1,
        isEnabled: () => true,
        getHooks: () => ({
          beforePhaseTransition: vi
            .fn()
            .mockRejectedValue(
              new Error('Cannot proceed to code - incomplete tasks')
            ),
        }),
      };

      registry.registerPlugin(validationPlugin);

      // Should re-throw validation errors
      await expect(
        registry.executeHook(
          'beforePhaseTransition',
          createMockContext(),
          'plan',
          'code'
        )
      ).rejects.toThrow('Cannot proceed to code - incomplete tasks');
    });

    it('should re-throw any beforePhaseTransition hook errors', async () => {
      const registry = new PluginRegistry();

      const validationPlugin: IPlugin = {
        getName: () => 'ValidationPlugin',
        getSequence: () => 1,
        isEnabled: () => true,
        getHooks: () => ({
          beforePhaseTransition: vi
            .fn()
            .mockRejectedValue(new Error('Validation failed for any reason')),
        }),
      };

      registry.registerPlugin(validationPlugin);

      // Should re-throw validation errors (not just specific messages)
      await expect(
        registry.executeHook(
          'beforePhaseTransition',
          createMockContext(),
          'plan',
          'code'
        )
      ).rejects.toThrow('Validation failed for any reason');
    });
  });

  describe('Multiple plugin execution', () => {
    it('should execute all plugins even if some fail on non-critical hooks', async () => {
      const registry = new PluginRegistry();

      const plugin1Spy = vi
        .fn()
        .mockRejectedValue(new Error('Plugin 1 failed'));
      const plugin2Spy = vi.fn().mockResolvedValue(undefined);
      const plugin3Spy = vi.fn().mockResolvedValue(undefined);

      registry.registerPlugin({
        getName: () => 'Plugin1',
        getSequence: () => 1,
        isEnabled: () => true,
        getHooks: () => ({ afterStartDevelopment: plugin1Spy }),
      });

      registry.registerPlugin({
        getName: () => 'Plugin2',
        getSequence: () => 2,
        isEnabled: () => true,
        getHooks: () => ({ afterStartDevelopment: plugin2Spy }),
      });

      registry.registerPlugin({
        getName: () => 'Plugin3',
        getSequence: () => 3,
        isEnabled: () => true,
        getHooks: () => ({ afterStartDevelopment: plugin3Spy }),
      });

      // Execute should not throw
      const _result = await registry.executeHook(
        'afterStartDevelopment',
        createMockContext(),
        { workflow: 'epcc', commit_behaviour: 'end' },
        {
          conversationId: 'test',
          planFilePath: '/test/plan.md',
          phase: 'explore',
          workflow: 'epcc',
        }
      );

      // All plugins should be called
      expect(plugin1Spy).toHaveBeenCalled();
      expect(plugin2Spy).toHaveBeenCalled();
      expect(plugin3Spy).toHaveBeenCalled();
    });
  });

  describe('Disabled plugin handling', () => {
    it('should not execute hooks from disabled plugins', async () => {
      const registry = new PluginRegistry();

      const hookSpy = vi.fn();

      const disabledPlugin: IPlugin = {
        getName: () => 'DisabledPlugin',
        getSequence: () => 1,
        isEnabled: () => false, // Disabled
        getHooks: () => ({ afterStartDevelopment: hookSpy }),
      };

      registry.registerPlugin(disabledPlugin);

      await registry.executeHook(
        'afterStartDevelopment',
        createMockContext(),
        { workflow: 'epcc', commit_behaviour: 'end' },
        {
          conversationId: 'test',
          planFilePath: '/test/plan.md',
          phase: 'explore',
          workflow: 'epcc',
        }
      );

      // Disabled plugin's hook should not be called
      expect(hookSpy).not.toHaveBeenCalled();
    });
  });
});
