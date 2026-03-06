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
    const { phase, conversationContext, planFileExists } = context;

    const phaseName = this.capitalizePhase(phase);

    let workflowSection = `---
**Workflow Continuity:**
Maintain \`${conversationContext.planFilePath}\`:
- Work through tasks in the "${phaseName}" section; mark done with \`[x]\`
- Add newly discovered tasks; log decisions in "Key Decisions"`;

    if (!planFileExists) {
      workflowSection += '\n- Note: plan file will be created on first update';
    }

    workflowSection += '\n\nCall `whats_next()` after each user message.';

    return `## ${phaseName} Phase\n\n${baseInstructions}\n\n${workflowSection}`;
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
