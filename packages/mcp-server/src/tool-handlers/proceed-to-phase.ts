/**
 * ProceedToPhase Tool Handler
 *
 * Handles explicit transitions to specific development phases when the current
 * phase is complete or when a direct phase change is needed.
 */

import { ConversationRequiredToolHandler } from './base-tool-handler.js';
import { validateRequiredArgs } from '../server-helpers.js';
import type { ConversationContext } from '@codemcp/workflows-core';
import { BeadsStateManager } from '@codemcp/workflows-core';
import { ServerComponentsFactory } from '../components/server-components-factory.js';
import { ServerContext } from '../types.js';

/**
 * Arguments for the proceed_to_phase tool
 */
export interface ProceedToPhaseArgs {
  target_phase: string;
  reason?: string;
  review_state: 'not-required' | 'pending' | 'performed';
}

/**
 * Response from the proceed_to_phase tool
 */
export interface ProceedToPhaseResult {
  phase: string;
  instructions: string;
  plan_file_path: string;
  transition_reason: string;
  is_modeled_transition: boolean;
  conversation_id: string;
}

/**
 * ProceedToPhase tool handler implementation
 */
export class ProceedToPhaseHandler extends ConversationRequiredToolHandler<
  ProceedToPhaseArgs,
  ProceedToPhaseResult
> {
  protected async executeWithConversation(
    args: ProceedToPhaseArgs,
    context: ServerContext,
    conversationContext: ConversationContext
  ): Promise<ProceedToPhaseResult> {
    // Validate required arguments
    validateRequiredArgs(args, ['target_phase', 'review_state']);

    const { target_phase, reason = '', review_state } = args;
    const conversationId = conversationContext.conversationId;
    const currentPhase = conversationContext.currentPhase;

    this.logger.debug('Processing proceed_to_phase request', {
      conversationId,
      currentPhase,
      targetPhase: target_phase,
      reason,
      reviewState: review_state,
    });

    // Validate review state if reviews are required
    if (conversationContext.requireReviewsBeforePhaseTransition) {
      await this.validateReviewState(
        review_state,
        currentPhase,
        target_phase,
        conversationContext.workflowName,
        context
      );
    }

    // Validate agent role for crowd workflows
    await this.validateAgentRole(
      currentPhase,
      target_phase,
      conversationContext.workflowName,
      conversationContext.projectPath,
      context
    );

    // Validate beads task completion if in beads mode
    await this.validateBeadsTaskCompletion(
      conversationId,
      currentPhase,
      target_phase,
      conversationContext.projectPath
    );

    // Ensure state machine is loaded for this project
    this.ensureStateMachineForProject(context, conversationContext.projectPath);

    // Perform explicit transition
    const transitionResult = context.transitionEngine.handleExplicitTransition(
      currentPhase,
      target_phase,
      conversationContext.projectPath,
      reason,
      conversationContext.workflowName
    );

    // Update conversation state
    await context.conversationManager.updateConversationState(conversationId, {
      currentPhase: transitionResult.newPhase,
    });

    this.logger.info('Explicit phase transition completed', {
      from: currentPhase,
      to: transitionResult.newPhase,
      reason: transitionResult.transitionReason,
    });

    // Ensure plan file exists - or create it
    await context.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );

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

    instructions.instructions += `

    After transitioning to the ${transitionResult.newPhase} phase, check the already created tasks and add those that are missing based on the key decisions noted in the plan file.
    While doing this, also denote dependencies for each task.
    `;

    // Add commit instructions if configured
    let finalInstructions = instructions.instructions;
    if (
      conversationContext.gitCommitConfig?.enabled &&
      conversationContext.gitCommitConfig.commitOnPhase
    ) {
      const commitMessage = `Phase transition: ${currentPhase} → ${target_phase}`;
      finalInstructions += `\n\n**Git Commit Required**: Create a commit for this phase transition using:\n\`\`\`bash\ngit add . && git commit -m "${commitMessage}"\n\`\`\``;
    }

    // Prepare response
    const response: ProceedToPhaseResult = {
      phase: transitionResult.newPhase,
      instructions: finalInstructions,
      plan_file_path: conversationContext.planFilePath,
      transition_reason: transitionResult.transitionReason,
      is_modeled_transition: transitionResult.isModeled,
      conversation_id: conversationContext.conversationId,
    };

    // Log interaction
    await this.logInteraction(
      context,
      conversationId,
      'proceed_to_phase',
      args,
      response,
      transitionResult.newPhase
    );

    return response;
  }

  /**
   * Validate review state for transitions that require reviews
   */
  private async validateReviewState(
    reviewState: string,
    currentPhase: string,
    targetPhase: string,
    workflowName: string,
    context: ServerContext
  ): Promise<void> {
    // Get transition configuration from workflow
    const stateMachine = context.workflowManager.loadWorkflowForProject(
      context.projectPath,
      workflowName
    );
    const currentState = stateMachine.states[currentPhase];

    if (!currentState) {
      throw new Error(`Invalid current phase: ${currentPhase}`);
    }

    const transition = currentState.transitions.find(t => t.to === targetPhase);
    if (!transition) {
      throw new Error(
        `No transition found from ${currentPhase} to ${targetPhase}`
      );
    }

    const hasReviewPerspectives =
      transition.review_perspectives &&
      transition.review_perspectives.length > 0;

    if (hasReviewPerspectives) {
      // This transition has review perspectives defined
      if (reviewState === 'pending') {
        throw new Error(
          `Review is required before proceeding to ${targetPhase}. Please use the conduct_review tool first.`
        );
      }
      if (reviewState === 'not-required') {
        throw new Error(
          `This transition requires review, but review_state is 'not-required'. Use 'pending' or 'performed'.`
        );
      }
    } else {
      // No review perspectives defined - transition proceeds normally
      // Note: No error thrown when hasReviewPerspectives is false, as per user feedback
    }
  }

  /**
   * Validate that the agent's role allows this phase transition (for crowd workflows)
   */
  private async validateAgentRole(
    currentPhase: string,
    targetPhase: string,
    workflowName: string,
    projectPath: string,
    context: ServerContext
  ): Promise<void> {
    // Get agent role from environment
    const agentRole = process.env['VIBE_ROLE'];

    // If no role specified, skip validation (single-agent mode)
    if (!agentRole) {
      return;
    }

    // Load workflow to check if it's a collaborative workflow
    const stateMachine = context.workflowManager.loadWorkflowForProject(
      projectPath,
      workflowName
    );

    // If workflow doesn't have collaboration enabled, skip validation
    if (!stateMachine.metadata?.collaboration) {
      return;
    }

    // Get current state definition
    const currentState = stateMachine.states[currentPhase];
    if (!currentState) {
      throw new Error(`Invalid current phase: ${currentPhase}`);
    }

    // Find the transition for this agent's role
    const agentTransition = currentState.transitions.find(
      t => t.to === targetPhase && (t.role === agentRole || !t.role)
    );

    if (!agentTransition) {
      throw new Error(
        `Agent with role '${agentRole}' cannot proceed from ${currentPhase} to ${targetPhase}. ` +
          `No transition available for this role.`
      );
    }

    // Check if agent will be responsible in target phase
    // Look at target state's outgoing transitions to determine responsibility
    const targetState = stateMachine.states[targetPhase];
    if (targetState) {
      const isResponsibleInTarget = targetState.transitions.some(
        t =>
          t.role === agentRole &&
          t.additional_instructions?.includes('RESPONSIBLE')
      );

      if (!isResponsibleInTarget) {
        // Agent is not responsible in target phase
        // This is allowed (agent can transition to consultation mode)
        this.logger.debug('Agent transitioning to consultative role', {
          agentRole,
          phase: targetPhase,
        });
      }
    }
  }

  /**
   * Validate that all beads tasks in the current phase are completed
   * before proceeding to the next phase. Only applies when beads mode is active.
   */
  private async validateBeadsTaskCompletion(
    conversationId: string,
    currentPhase: string,
    targetPhase: string,
    projectPath: string
  ): Promise<void> {
    try {
      // Use factory to create task backend client (strategy pattern)
      const factory = new ServerComponentsFactory({ projectPath });
      const taskBackendClient = factory.createTaskBackendClient();

      if (!taskBackendClient) {
        // Not in beads mode or beads not available, skip validation
        this.logger.debug(
          'Skipping beads task validation - no task backend client available',
          {
            conversationId,
            currentPhase,
            targetPhase,
          }
        );
        return;
      }

      // Get beads state for this conversation
      const beadsStateManager = new BeadsStateManager(projectPath);
      const currentPhaseTaskId = await beadsStateManager.getPhaseTaskId(
        conversationId,
        currentPhase
      );

      if (!currentPhaseTaskId) {
        // No beads state found for this conversation - fallback to graceful handling
        this.logger.debug('No beads phase task ID found for current phase', {
          conversationId,
          currentPhase,
          targetPhase,
          projectPath,
        });
        return;
      }

      this.logger.debug(
        'Checking for incomplete beads tasks using task backend client',
        {
          conversationId,
          currentPhase,
          currentPhaseTaskId,
        }
      );

      // Use task backend client to validate task completion (strategy pattern)
      const validationResult =
        await taskBackendClient.validateTasksCompleted(currentPhaseTaskId);

      if (!validationResult.valid) {
        // Get the incomplete tasks from the validation result
        const incompleteTasks = validationResult.openTasks;

        // Create detailed error message with incomplete tasks
        const taskDetails = incompleteTasks
          .map(task => `  • ${task.id} - ${task.title || 'Untitled task'}`)
          .join('\n');

        const errorMessage = `Cannot proceed to ${targetPhase} - ${incompleteTasks.length} incomplete task(s) in current phase "${currentPhase}":

${taskDetails}

To proceed, check the in-progress-tasks using:

  bd list --parent ${currentPhaseTaskId} --status open

You can also defer tasks if they're no longer needed:
  bd defer <task-id> --until tomorrow`;

        this.logger.info(
          'Blocking phase transition due to incomplete beads tasks',
          {
            conversationId,
            currentPhase,
            targetPhase,
            currentPhaseTaskId,
            incompleteTaskCount: incompleteTasks.length,
            incompleteTaskIds: incompleteTasks.map(t => t.id),
          }
        );

        throw new Error(errorMessage);
      }

      this.logger.info(
        'All beads tasks completed in current phase, allowing transition',
        {
          conversationId,
          currentPhase,
          targetPhase,
          currentPhaseTaskId,
        }
      );
    } catch (error) {
      // Re-throw validation errors (incomplete tasks)
      if (
        error instanceof Error &&
        error.message.includes('Cannot proceed to')
      ) {
        throw error;
      }

      // Log other errors but allow transition (graceful degradation)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        'Beads task validation failed, allowing transition to proceed',
        {
          error: errorMessage,
          conversationId,
          currentPhase,
          targetPhase,
          projectPath,
        }
      );
    }
  }
}
