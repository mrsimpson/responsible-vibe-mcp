/**
 * Instruction Generator
 *
 * Creates phase-specific guidance for the LLM based on current conversation state.
 * Customizes instructions based on project context and development phase.
 * Supports custom state machine definitions for dynamic instruction generation.
 * Handles variable substitution for project artifact references.
 */

// ConversationContext import removed as it's not used
import { PlanManager } from './plan-manager.js';
import { ProjectDocsManager } from './project-docs-manager.js';
import type { YamlStateMachine } from './state-machine-types.js';
// Task backend detection now handled by factory pattern
import type {
  IInstructionGenerator,
  InstructionContext,
  GeneratedInstructions,
} from './interfaces/instruction-generator.interface.js';

export class InstructionGenerator implements IInstructionGenerator {
  private projectDocsManager: ProjectDocsManager;

  constructor(_planManager: PlanManager) {
    // planManager parameter kept for API compatibility but not stored since unused
    this.projectDocsManager = new ProjectDocsManager();
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

    // Generate task management guidance for markdown backend
    const taskGuidance = this.generateTaskManagementGuidance();

    let enhanced: string;

    // Markdown mode: Traditional plan file approach
    enhanced = `Check your plan file at \`${conversationContext.planFilePath}\` and focus on the "${this.capitalizePhase(phase)}" section.

${baseInstructions}

**Plan File Guidance:**
- Work on the tasks listed in the ${this.capitalizePhase(phase)} section
${taskGuidance}
- Update the "Key Decisions" section with important choices made
- Add relevant notes to help maintain context`;
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
    enhanced += `\n\n**Important Reminders:**
- Use ONLY the development plan for task management - do not use your own task management tools
- Call whats_next() after the next user message to maintain the development workflow`;

    return enhanced;
  }

  /**
   * Generate task management guidance for markdown backend
   */
  private generateTaskManagementGuidance(): string {
    // Default markdown backend
    return `- Mark completed tasks with [x] as you finish them
- Add new tasks as they are identified during your work with the user`;
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
