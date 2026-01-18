/**
 * Instruction Generator
 *
 * Creates phase-specific guidance for the LLM based on current conversation state.
 * Customizes instructions based on project context and development phase.
 * Supports custom state machine definitions for dynamic instruction generation.
 * Handles variable substitution for project artifact references.
 */

import type { ConversationContext } from './types.js';
import { PlanManager } from './plan-manager.js';
import { ProjectDocsManager } from './project-docs-manager.js';
import type { YamlStateMachine } from './state-machine-types.js';
import { TaskBackendManager, type TaskBackendConfig } from './task-backend.js';

export interface InstructionContext {
  phase: string;
  conversationContext: ConversationContext;
  transitionReason: string;
  isModeled: boolean;
  planFileExists: boolean;
}

export interface GeneratedInstructions {
  instructions: string;
  planFileGuidance: string;
  metadata: {
    phase: string;
    planFilePath: string;
    transitionReason: string;
    isModeled: boolean;
  };
}

export class InstructionGenerator {
  private projectDocsManager: ProjectDocsManager;
  private taskBackendDetector: () => TaskBackendConfig;

  constructor(
    _planManager: PlanManager,
    taskBackendDetector: () => TaskBackendConfig = TaskBackendManager.detectTaskBackend
  ) {
    // planManager parameter kept for API compatibility but not stored since unused
    this.projectDocsManager = new ProjectDocsManager();
    this.taskBackendDetector = taskBackendDetector;
  }

  /**
   * Set the state machine definition for dynamic instruction generation
   */
  setStateMachine(_stateMachine: YamlStateMachine): void {
    // stateMachine parameter kept for API compatibility but not stored since unused
    return;
  }

  /**
   * Generate comprehensive instructions for the LLM
   */
  async generateInstructions(
    baseInstructions: string,
    context: InstructionContext
  ): Promise<GeneratedInstructions> {
    // Apply variable substitution to base instructions
    const substitutedInstructions = this.applyVariableSubstitution(
      baseInstructions,
      context.conversationContext.projectPath,
      context.conversationContext.gitBranch
    );

    // Enhance base instructions with context-specific guidance
    const enhancedInstructions = await this.enhanceInstructions(
      substitutedInstructions,
      context
    );

    return {
      instructions: enhancedInstructions,
      planFileGuidance:
        'Task management guidance is now included in main instructions',
      metadata: {
        phase: context.phase,
        planFilePath: context.conversationContext.planFilePath,
        transitionReason: context.transitionReason,
        isModeled: context.isModeled,
      },
    };
  }

  /**
   * Apply variable substitution to instructions
   * Replaces project artifact variables with actual file paths
   */
  private applyVariableSubstitution(
    instructions: string,
    projectPath: string,
    gitBranch?: string
  ): string {
    const substitutions = this.projectDocsManager.getVariableSubstitutions(
      projectPath,
      gitBranch
    );

    let result = instructions;
    for (const [variable, value] of Object.entries(substitutions)) {
      // Use global replace to handle multiple occurrences
      result = result.replace(
        new RegExp(this.escapeRegExp(variable), 'g'),
        value
      );
    }

    return result;
  }

  /**
   * Escape special regex characters in variable names
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Enhance base instructions with context-specific information
   */
  private async enhanceInstructions(
    baseInstructions: string,
    context: InstructionContext
  ): Promise<string> {
    const {
      phase,
      conversationContext,
      transitionReason,
      isModeled,
      planFileExists,
    } = context;

    // Generate task-backend-specific guidance
    const taskBackendConfig = this.taskBackendDetector();
    const taskGuidance = this.generateTaskManagementGuidance(taskBackendConfig);

    let enhanced: string;

    // Different instruction structure for beads vs markdown
    if (
      taskBackendConfig.backend === 'beads' &&
      taskBackendConfig.isAvailable
    ) {
      // Beads mode: Focus on bd CLI task management, not plan file
      enhanced = `You are in the ${phase} phase.
${baseInstructions}

**Plan File Guidance:**
Use the plan file as memory for the current objective
- Update the "Key Decisions" section with important choices made
- Add relevant notes to help maintain context
- Do NOT enter tasks in the plan file, follow the below instructions for plan file management

**Task Management Guidance:**
${taskGuidance}
        `;
    } else {
      // Markdown mode: Traditional plan file approach
      enhanced = `Check your plan file at \`${conversationContext.planFilePath}\` and focus on the "${this.capitalizePhase(phase)}" section.

${baseInstructions}

**Plan File Guidance:**
- Work on the tasks listed in the ${this.capitalizePhase(phase)} section
${taskGuidance}
- Update the "Key Decisions" section with important choices made
- Add relevant notes to help maintain context`;
    }

    // Add project context
    enhanced += `\n\n**Project Context:**
- Project: ${conversationContext.projectPath}
- Branch: ${conversationContext.gitBranch}
- Current Phase: ${phase}`;

    // Add transition context if this is a modeled transition
    if (isModeled && transitionReason) {
      enhanced += `\n\n**Phase Context:**
- ${transitionReason}`;
    }

    // Add plan file creation note if needed
    if (!planFileExists) {
      enhanced +=
        '\n\n**Note**: Plan file will be created when you first update it.';
    }

    // Add continuity and task management instructions
    const taskReminder =
      taskBackendConfig.backend === 'beads' && taskBackendConfig.isAvailable
        ? 'Use ONLY bd CLI tool for task management - do not use your own task management tools'
        : 'Use ONLY the development plan for task management - do not use your own task management tools';

    enhanced += `\n\n**Important Reminders:**
- ${taskReminder}
- Call whats_next() after the next user message to maintain the development workflow`;

    return enhanced;
  }

  /**
   * Generate task management guidance based on active backend
   */
  private generateTaskManagementGuidance(
    taskBackendConfig: TaskBackendConfig
  ): string {
    if (
      taskBackendConfig.backend === 'beads' &&
      taskBackendConfig.isAvailable
    ) {
      return `- Use bd CLI tool exclusively
- **Start by listing ready tasks**: \`bd list --parent <phase-task-id> --status open\`
- **Create new tasks**: \`bd create 'Task title' --parent <phase-task-id> -p 2\`
- **Update status when working**: \`bd update <task-id> --status in_progress\`
- **Complete tasks**: \`bd close <task-id>\`
- **Focus on ready tasks first** - let beads handle dependencies
- Add new tasks as they are identified during your work with the user`;
    } else {
      // Default markdown backend
      return `- Mark completed tasks with [x] as you finish them
- Add new tasks as they are identified during your work with the user`;
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
