/**
 * Test CommitPlugin activation and lifecycle hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitPlugin } from '../../src/plugin-system/commit-plugin.js';
import type { PluginHookContext } from '../../src/plugin-system/plugin-interfaces.js';

// Mock GitManager
vi.mock('@codemcp/workflows-core', async () => {
  const actual = await vi.importActual('@codemcp/workflows-core');
  return {
    ...actual,
    GitManager: {
      isGitRepository: vi.fn(),
      hasUncommittedChanges: vi.fn(),
      createCommit: vi.fn(),
    },
  };
});

describe('CommitPlugin', () => {
  let plugin: CommitPlugin;
  const projectPath = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env.COMMIT_BEHAVIOR;
    delete process.env.COMMIT_MESSAGE_TEMPLATE;
  });

  describe('Plugin Interface', () => {
    it('should have correct name and sequence', () => {
      plugin = new CommitPlugin({ projectPath });

      expect(plugin.getName()).toBe('CommitPlugin');
      expect(plugin.getSequence()).toBe(50); // Before BeadsPlugin (100)
    });

    it('should be enabled when COMMIT_BEHAVIOR is set', () => {
      process.env.COMMIT_BEHAVIOR = 'step';
      plugin = new CommitPlugin({ projectPath });

      expect(plugin.isEnabled()).toBe(true);
    });

    it('should be disabled when COMMIT_BEHAVIOR is not set', () => {
      plugin = new CommitPlugin({ projectPath });

      expect(plugin.isEnabled()).toBe(false);
    });

    it('should be disabled when COMMIT_BEHAVIOR is invalid', () => {
      process.env.COMMIT_BEHAVIOR = 'invalid';
      plugin = new CommitPlugin({ projectPath });

      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('Lifecycle Hooks', () => {
    beforeEach(() => {
      process.env.COMMIT_BEHAVIOR = 'step';
      plugin = new CommitPlugin({ projectPath });
    });

    it('should provide afterStartDevelopment hook', () => {
      const hooks = plugin.getHooks();

      expect(hooks.afterStartDevelopment).toBeDefined();
      expect(typeof hooks.afterStartDevelopment).toBe('function');
    });

    it('should provide beforePhaseTransition hook', () => {
      const hooks = plugin.getHooks();

      expect(hooks.beforePhaseTransition).toBeDefined();
      expect(typeof hooks.beforePhaseTransition).toBe('function');
    });

    it('should provide afterPlanFileCreated hook', () => {
      const hooks = plugin.getHooks();

      expect(hooks.afterPlanFileCreated).toBeDefined();
      expect(typeof hooks.afterPlanFileCreated).toBe('function');
    });
  });

  describe('Step Commit Behavior', () => {
    beforeEach(() => {
      process.env.COMMIT_BEHAVIOR = 'step';
      plugin = new CommitPlugin({ projectPath });
    });

    it('should create WIP commit on whats_next calls', async () => {
      const { GitManager } = await import('@codemcp/workflows-core');
      vi.mocked(GitManager.isGitRepository).mockReturnValue(true);
      vi.mocked(GitManager.hasUncommittedChanges).mockReturnValue(true);
      vi.mocked(GitManager.createCommit).mockReturnValue(true);

      const context: PluginHookContext = {
        conversationId: 'test-conv',
        planFilePath: '/test/plan.md',
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath,
        gitBranch: 'feature/test',
      };

      const hooks = plugin.getHooks();
      await hooks.afterStartDevelopment?.(
        context,
        { workflow: 'epcc' },
        {
          conversationId: 'test-conv',
          planFilePath: '/test/plan.md',
          phase: 'explore',
          workflow: 'epcc',
        }
      );

      // Should store initial commit hash for later squashing
      expect(GitManager.isGitRepository).toHaveBeenCalledWith(projectPath);
    });
  });

  describe('Phase Commit Behavior', () => {
    beforeEach(() => {
      process.env.COMMIT_BEHAVIOR = 'phase';
      plugin = new CommitPlugin({ projectPath });
    });

    it('should create WIP commit before phase transitions', async () => {
      const { GitManager } = await import('@codemcp/workflows-core');
      vi.mocked(GitManager.isGitRepository).mockReturnValue(true);
      vi.mocked(GitManager.hasUncommittedChanges).mockReturnValue(true);
      vi.mocked(GitManager.createCommit).mockReturnValue(true);

      const context: PluginHookContext = {
        conversationId: 'test-conv',
        planFilePath: '/test/plan.md',
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath,
        gitBranch: 'feature/test',
        targetPhase: 'plan',
      };

      const hooks = plugin.getHooks();
      await hooks.beforePhaseTransition?.(context, 'explore', 'plan');

      expect(GitManager.hasUncommittedChanges).toHaveBeenCalledWith(
        projectPath
      );
      expect(GitManager.createCommit).toHaveBeenCalledWith(
        'WIP: transition to plan',
        projectPath
      );
    });
  });

  describe('End Commit Behavior', () => {
    beforeEach(() => {
      process.env.COMMIT_BEHAVIOR = 'end';
      plugin = new CommitPlugin({ projectPath });
    });

    it('should add final commit task to plan file', async () => {
      const context: PluginHookContext = {
        conversationId: 'test-conv',
        planFilePath: '/test/plan.md',
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath,
        gitBranch: 'feature/test',
      };

      const planContent = `## Commit
### Tasks
- [ ] Review implementation
### Completed
*None yet*`;

      const hooks = plugin.getHooks();
      const result = await hooks.afterPlanFileCreated?.(
        context,
        '/test/plan.md',
        planContent
      );

      expect(result).toContain('Create a conventional commit');
      expect(result).toContain('summarize the intentions and key decisions');
    });
  });
});
