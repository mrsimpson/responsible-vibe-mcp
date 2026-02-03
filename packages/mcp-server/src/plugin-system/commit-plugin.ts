/**
 * CommitPlugin Implementation
 *
 * Plugin that handles automatic git commits based on COMMIT_BEHAVIOR environment variable.
 * Supports step, phase, and end commit modes with configurable message templates.
 */

import type {
  IPlugin,
  PluginHooks,
  PluginHookContext,
  StartDevelopmentArgs,
  StartDevelopmentResult,
} from './plugin-interfaces.js';
import { GitManager, createLogger } from '@codemcp/workflows-core';

const logger = createLogger('CommitPlugin');

/**
 * CommitPlugin class implementing the IPlugin interface
 *
 * Activation: Only when process.env.COMMIT_BEHAVIOR is set to valid value
 * Priority: Sequence 50 (before BeadsPlugin at 100)
 */
export class CommitPlugin implements IPlugin {
  private projectPath: string;
  private initialCommitHash?: string;

  constructor(options: { projectPath: string }) {
    this.projectPath = options.projectPath;
    logger.debug('CommitPlugin initialized', { projectPath: this.projectPath });
  }

  getName(): string {
    return 'CommitPlugin';
  }

  getSequence(): number {
    return 50; // Before BeadsPlugin (100)
  }

  isEnabled(): boolean {
    const behavior = process.env.COMMIT_BEHAVIOR;
    const enabled =
      behavior && ['step', 'phase', 'end', 'none'].includes(behavior);
    logger.debug('CommitPlugin enablement check', {
      COMMIT_BEHAVIOR: behavior,
      enabled: !!enabled,
    });
    return !!enabled;
  }

  getHooks(): PluginHooks {
    return {
      afterStartDevelopment: this.handleAfterStartDevelopment.bind(this),
      beforePhaseTransition: this.handleBeforePhaseTransition.bind(this),
      afterPlanFileCreated: this.handleAfterPlanFileCreated.bind(this),
    };
  }

  /**
   * Handle afterStartDevelopment hook
   * Store initial commit hash for potential squashing later
   */
  private async handleAfterStartDevelopment(
    context: PluginHookContext,
    _args: StartDevelopmentArgs,
    _result: StartDevelopmentResult
  ): Promise<void> {
    logger.info('CommitPlugin: Setting up commit behavior', {
      conversationId: context.conversationId,
      behavior: process.env.COMMIT_BEHAVIOR,
      projectPath: context.projectPath,
    });

    try {
      if (GitManager.isGitRepository(context.projectPath)) {
        this.initialCommitHash =
          GitManager.getCurrentCommitHash(context.projectPath) || undefined;
        logger.debug('CommitPlugin: Stored initial commit hash', {
          conversationId: context.conversationId,
          initialCommitHash: this.initialCommitHash,
        });
      }
    } catch (error) {
      logger.warn('CommitPlugin: Failed to get initial commit hash', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: context.conversationId,
      });
    }
  }

  /**
   * Handle beforePhaseTransition hook
   * Create WIP commits for phase and step modes
   */
  private async handleBeforePhaseTransition(
    context: PluginHookContext,
    currentPhase: string,
    targetPhase: string
  ): Promise<void> {
    const behavior = process.env.COMMIT_BEHAVIOR;

    if (behavior !== 'phase' && behavior !== 'step') {
      return; // Only commit on phase transitions for these modes
    }

    logger.info('CommitPlugin: Creating WIP commit before phase transition', {
      conversationId: context.conversationId,
      currentPhase,
      targetPhase,
      behavior,
    });

    try {
      if (!GitManager.isGitRepository(context.projectPath)) {
        logger.debug('CommitPlugin: Not a git repository, skipping commit');
        return;
      }

      if (!GitManager.hasUncommittedChanges(context.projectPath)) {
        logger.debug('CommitPlugin: No uncommitted changes, skipping commit');
        return;
      }

      const message = `WIP: transition to ${targetPhase}`;
      const success = GitManager.createCommit(message, context.projectPath);

      if (success) {
        logger.info('CommitPlugin: Created WIP commit successfully', {
          conversationId: context.conversationId,
          message,
        });
      } else {
        logger.warn('CommitPlugin: Failed to create WIP commit', {
          conversationId: context.conversationId,
          message,
        });
      }
    } catch (error) {
      logger.warn('CommitPlugin: Error during phase transition commit', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: context.conversationId,
      });
    }
  }

  /**
   * Handle afterPlanFileCreated hook
   * Add final commit task for end mode or step/phase modes with squashing
   */
  private async handleAfterPlanFileCreated(
    context: PluginHookContext,
    planFilePath: string,
    content: string
  ): Promise<string> {
    const behavior = process.env.COMMIT_BEHAVIOR;

    if (!behavior || behavior === 'none') {
      return content; // No commit behavior
    }

    logger.debug('CommitPlugin: Adding final commit task to plan file', {
      conversationId: context.conversationId,
      behavior,
      planFilePath,
    });

    try {
      // Find the final phase (usually "Commit" or last phase)
      const lines = content.split('\n');
      let finalPhaseIndex = -1;

      // Look for "## Commit" section first
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.trim() === '## Commit') {
          finalPhaseIndex = i;
          break;
        }
      }

      // If no Commit section, find the last ## section
      if (finalPhaseIndex === -1) {
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (
            line?.startsWith('## ') &&
            !line.includes('Notes') &&
            !line.includes('Key Decisions')
          ) {
            finalPhaseIndex = i;
            break;
          }
        }
      }

      if (finalPhaseIndex === -1) {
        logger.warn(
          'CommitPlugin: Could not find final phase to add commit task'
        );
        return content;
      }

      // Generate commit task based on behavior
      let commitTask: string;
      const defaultMessage =
        process.env.COMMIT_MESSAGE_TEMPLATE ||
        'Create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies';

      if (behavior === 'end') {
        // End mode: simple final commit
        commitTask = `- [ ] ${defaultMessage}`;
      } else {
        // Step/phase mode: squash WIP commits with instructions
        const squashInstructions = `Squash WIP commits: \`git reset --soft <first commit of this branch>. Then, ${defaultMessage}`;
        commitTask = `- [ ] ${squashInstructions}`;
      }

      // Find the Tasks section in the final phase and add the commit task
      let tasksIndex = -1;
      for (let i = finalPhaseIndex; i < lines.length; i++) {
        if (lines[i]?.trim() === '### Tasks') {
          tasksIndex = i;
          break;
        }
      }

      if (tasksIndex !== -1) {
        // Insert after ### Tasks line
        lines.splice(tasksIndex + 1, 0, commitTask);
      } else {
        // Add Tasks section if it doesn't exist
        lines.splice(finalPhaseIndex + 1, 0, '', '### Tasks', commitTask);
      }

      const updatedContent = lines.join('\n');
      logger.info('CommitPlugin: Added final commit task to plan file', {
        conversationId: context.conversationId,
        behavior,
        commitTask,
      });

      return updatedContent;
    } catch (error) {
      logger.warn('CommitPlugin: Failed to add commit task to plan file', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: context.conversationId,
      });
      return content; // Return original content on error
    }
  }
}
