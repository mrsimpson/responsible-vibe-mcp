/**
 * WhatsNext Tool Handler
 *
 * Handles the whats_next tool which analyzes conversation context and
 * determines the next development phase with specific instructions for the LLM.
 */

import { ConversationRequiredToolHandler } from './base-tool-handler.js';
import type { ConversationContext } from '@codemcp/workflows-core';
import { TaskBackendManager, BeadsIntegration } from '@codemcp/workflows-core';
import { ServerContext } from '../types.js';

/**
 * Arguments for the whats_next tool
 */
export interface WhatsNextArgs {
  context?: string;
  user_input?: string;
  conversation_summary?: string;
  recent_messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Response from the whats_next tool
 */
export interface WhatsNextResult {
  phase: string;
  instructions: string;
  plan_file_path: string;
  is_modeled_transition: boolean;
  conversation_id: string;
}

/**
 * WhatsNext tool handler implementation
 */
export class WhatsNextHandler extends ConversationRequiredToolHandler<
  WhatsNextArgs,
  WhatsNextResult
> {
  protected override async executeHandler(
    args: WhatsNextArgs,
    context: ServerContext
  ): Promise<WhatsNextResult> {
    let conversationContext;

    try {
      conversationContext = await this.getConversationContext(context);
    } catch (_error) {
      // Use standard CONVERSATION_NOT_FOUND error
      throw new Error('CONVERSATION_NOT_FOUND');
    }

    return this.executeWithConversation(args, context, conversationContext);
  }

  protected async executeWithConversation(
    args: WhatsNextArgs,
    context: ServerContext,
    conversationContext: ConversationContext
  ): Promise<WhatsNextResult> {
    const {
      context: requestContext = '',
      user_input = '',
      conversation_summary = '',
      recent_messages = [],
    } = args;

    const conversationId = conversationContext.conversationId;
    const currentPhase = conversationContext.currentPhase;

    this.logger.debug('Processing whats_next request', {
      conversationId,
      currentPhase,
      hasContext: !!requestContext,
      hasUserInput: !!user_input,
    });

    // Ensure state machine is loaded for this project
    this.ensureStateMachineForProject(
      context,
      conversationContext.projectPath,
      conversationContext.workflowName
    );

    // Ensure plan file exists
    await context.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );

    // Analyze phase transition
    const transitionResult =
      await context.transitionEngine.analyzePhaseTransition({
        currentPhase,
        projectPath: conversationContext.projectPath,
        userInput: user_input,
        context: requestContext,
        conversationSummary: conversation_summary,
        recentMessages: recent_messages,
        conversationId: conversationContext.conversationId,
      });

    // Update conversation state if phase changed
    if (transitionResult.newPhase !== currentPhase) {
      const shouldUpdateState = await this.shouldUpdateConversationState(
        currentPhase,
        transitionResult.newPhase,
        conversationContext,
        context
      );

      if (shouldUpdateState) {
        await context.conversationManager.updateConversationState(
          conversationId,
          { currentPhase: transitionResult.newPhase }
        );
      }

      // If this was a first-call auto-transition, regenerate the plan file
      if (
        transitionResult.transitionReason.includes(
          'Starting development - defining criteria'
        )
      ) {
        this.logger.info(
          'Regenerating plan file after first-call auto-transition',
          {
            from: currentPhase,
            to: transitionResult.newPhase,
            planFilePath: conversationContext.planFilePath,
          }
        );

        await context.planManager.ensurePlanFile(
          conversationContext.planFilePath,
          conversationContext.projectPath,
          conversationContext.gitBranch
        );
      }

      this.logger.info('Phase transition completed', {
        from: currentPhase,
        to: transitionResult.newPhase,
        reason: transitionResult.transitionReason,
      });
    }

    // Check if plan file exists
    const planInfo = await context.planManager.getPlanFileInfo(
      conversationContext.planFilePath
    );

    // Generate enhanced instructions
    const instructions =
      await context.instructionGenerator.generateInstructions(
        transitionResult.instructions,
        {
          phase: transitionResult.newPhase,
          conversationContext: {
            ...conversationContext,
            currentPhase: transitionResult.newPhase,
          },
          transitionReason: transitionResult.transitionReason,
          isModeled: transitionResult.isModeled,
          planFileExists: planInfo.exists,
        }
      );

    // Add commit instructions if configured
    let finalInstructions = instructions.instructions;
    if (
      conversationContext.gitCommitConfig?.enabled &&
      conversationContext.gitCommitConfig.commitOnStep
    ) {
      const commitMessage = requestContext || 'Step completion';
      finalInstructions += `\n\n**Git Commit Required**: Create a commit for this step using:\n\`\`\`bash\ngit add . && git commit -m "${commitMessage}"\n\`\`\``;
    }

    // Add beads instructions if beads backend is active
    const beadsInstructions = await this.generateBeadsInstructions(
      conversationContext,
      transitionResult.newPhase
    );
    if (beadsInstructions) {
      finalInstructions += '\n\n' + beadsInstructions;
    }

    // Prepare response
    const response: WhatsNextResult = {
      phase: transitionResult.newPhase,
      instructions: finalInstructions,
      plan_file_path: conversationContext.planFilePath,
      is_modeled_transition: transitionResult.isModeled,
      conversation_id: conversationContext.conversationId,
    };

    // Log interaction
    await this.logInteraction(
      context,
      conversationId,
      'whats_next',
      args,
      response,
      transitionResult.newPhase
    );

    return response;
  }

  /**
   * Determines whether conversation state should be updated for a phase transition
   */
  private async shouldUpdateConversationState(
    currentPhase: string,
    newPhase: string,
    conversationContext: ConversationContext,
    context: ServerContext
  ): Promise<boolean> {
    if (!conversationContext.requireReviewsBeforePhaseTransition) {
      return true;
    }

    const stateMachine = context.workflowManager.loadWorkflowForProject(
      conversationContext.projectPath,
      conversationContext.workflowName
    );

    const currentState = stateMachine.states[currentPhase];
    if (!currentState) {
      return true;
    }

    const transition = currentState.transitions.find(t => t.to === newPhase);
    if (!transition) {
      return true;
    }

    const hasReviewPerspectives =
      transition.review_perspectives &&
      transition.review_perspectives.length > 0;

    if (hasReviewPerspectives) {
      this.logger.debug(
        'Preventing state update - review required for transition',
        {
          from: currentPhase,
          to: newPhase,
          reviewPerspectives: transition.review_perspectives?.length || 0,
        }
      );
      return false;
    }

    return true;
  }

  /**
   * Generate beads-specific instructions if beads backend is active
   */
  private async generateBeadsInstructions(
    conversationContext: ConversationContext,
    currentPhase: string
  ): Promise<string | null> {
    // Check if beads backend is configured
    const taskBackendConfig = TaskBackendManager.detectTaskBackend();
    if (
      taskBackendConfig.backend !== 'beads' ||
      !taskBackendConfig.isAvailable
    ) {
      return null;
    }

    try {
      // Read plan file to extract current phase task ID
      const phaseTaskId = await this.extractPhaseTaskId(
        conversationContext.planFilePath,
        currentPhase
      );
      if (!phaseTaskId) {
        this.logger.warn(
          'Could not find beads phase task ID for current phase',
          {
            phase: currentPhase,
            planFilePath: conversationContext.planFilePath,
          }
        );
        return null;
      }

      // Generate beads instructions using BeadsIntegration utility
      const beadsIntegration = new BeadsIntegration(
        conversationContext.projectPath
      );
      const phaseName = this.capitalizePhase(currentPhase);
      return beadsIntegration.generateBeadsInstructions(phaseTaskId, phaseName);
    } catch (error) {
      this.logger.warn('Failed to generate beads instructions', {
        phase: currentPhase,
        projectPath: conversationContext.projectPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Extract beads phase task ID from plan file for the given phase
   */
  private async extractPhaseTaskId(
    planFilePath: string,
    phase: string
  ): Promise<string | null> {
    try {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(planFilePath, 'utf-8');

      const phaseName = this.capitalizePhase(phase);
      const phaseHeader = `## ${phaseName}`;

      // Look for the phase header followed by beads-phase-id comment
      const phaseSection = content.split('\n');
      let foundPhaseHeader = false;

      for (const line of phaseSection) {
        if (line.trim() === phaseHeader) {
          foundPhaseHeader = true;
          continue;
        }

        if (foundPhaseHeader && line.includes('beads-phase-id:')) {
          const match = line.match(/beads-phase-id:\s*([\w\d-]+)/);
          if (match) {
            return match[1] || null;
          }
        }

        // Stop looking if we hit the next phase header
        if (foundPhaseHeader && line.startsWith('##') && line !== phaseHeader) {
          break;
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(
        'Failed to read plan file for phase task ID extraction',
        {
          planFilePath,
          phase,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return null;
    }
  }

  /**
   * Capitalize phase name for display
   */
  private capitalizePhase(phase: string): string {
    return phase
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
