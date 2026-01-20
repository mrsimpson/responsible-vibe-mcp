/**
 * Beads Plan Manager
 *
 * Beads-specific implementation of IPlanManager.
 * Manages plan files optimized for beads task management workflow.
 */

import {
  type IPlanManager,
  type PlanFileInfo,
  type YamlStateMachine,
  type TaskBackendConfig,
  createLogger,
} from '@codemcp/workflows-core';
import { writeFile, readFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';

const logger = createLogger('BeadsPlanManager');

/**
 * Beads-specific plan manager implementation
 */
export class BeadsPlanManager implements IPlanManager {
  private stateMachine: YamlStateMachine | null = null;

  /**
   * Set the state machine definition for dynamic plan generation
   */
  setStateMachine(stateMachine: YamlStateMachine): void {
    this.stateMachine = stateMachine;
    logger.debug('State machine set for beads plan manager', {
      name: stateMachine.name,
      phases: Object.keys(stateMachine.states),
    });
  }

  /**
   * Set the task backend configuration
   */
  setTaskBackend(taskBackend: TaskBackendConfig): void {
    // Task backend is implicit for beads plan manager (always beads)
    logger.debug('Task backend set for beads plan manager', {
      backend: taskBackend.backend,
      available: taskBackend.isAvailable,
    });
  }

  /**
   * Get plan file information
   */
  async getPlanFileInfo(planFilePath: string): Promise<PlanFileInfo> {
    try {
      await access(planFilePath);
      const content = await readFile(planFilePath, 'utf-8');
      return {
        path: planFilePath,
        exists: true,
        content,
      };
    } catch (_error) {
      return {
        path: planFilePath,
        exists: false,
      };
    }
  }

  /**
   * Create initial plan file if it doesn't exist
   */
  async ensurePlanFile(
    planFilePath: string,
    projectPath: string,
    gitBranch: string
  ): Promise<void> {
    logger.debug('Ensuring beads plan file exists', {
      planFilePath,
      projectPath,
      gitBranch,
    });

    const planInfo = await this.getPlanFileInfo(planFilePath);

    if (!planInfo.exists) {
      logger.info('Plan file not found, creating beads-optimized plan', {
        planFilePath,
      });
      await this.createInitialBeadsPlanFile(
        planFilePath,
        projectPath,
        gitBranch
      );
      logger.info('Beads plan file created successfully', { planFilePath });
    } else {
      logger.debug('Plan file already exists', { planFilePath });
    }
  }

  /**
   * Create initial plan file optimized for beads workflow
   */
  private async createInitialBeadsPlanFile(
    planFilePath: string,
    projectPath: string,
    gitBranch: string
  ): Promise<void> {
    logger.debug('Creating beads-optimized plan file', { planFilePath });

    try {
      // Ensure directory exists
      await mkdir(dirname(planFilePath), { recursive: true });
      logger.debug('Plan file directory ensured', {
        directory: dirname(planFilePath),
      });

      const projectName = projectPath.split('/').pop() || 'Unknown Project';
      const branchInfo = gitBranch !== 'no-git' ? ` (${gitBranch} branch)` : '';

      const initialContent = this.generateBeadsInitialPlanContent(
        projectName,
        branchInfo
      );

      await writeFile(planFilePath, initialContent, 'utf-8');
      logger.info('Beads plan file written successfully', {
        planFilePath,
        contentLength: initialContent.length,
        projectName,
      });
    } catch (error) {
      logger.error('Failed to create beads plan file', error as Error, {
        planFilePath,
      });
      throw error;
    }
  }

  /**
   * Generate initial plan file content optimized for beads workflow
   */
  private generateBeadsInitialPlanContent(
    projectName: string,
    branchInfo: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];

    if (!this.stateMachine) {
      throw new Error(
        'State machine not set. This should not happen as state machine is always loaded.'
      );
    }

    const phases = Object.keys(this.stateMachine.states);
    const initialPhase = this.stateMachine.initial_state;

    const documentationUrl = this.generateWorkflowDocumentationUrl(
      this.stateMachine.name
    );

    let content = `# Development Plan: ${projectName}${branchInfo}

*Generated on ${timestamp} by Vibe Feature MCP*
*Workflow: ${
      documentationUrl
        ? '[' + this.stateMachine.name + ']' + '(' + documentationUrl + ')'
        : this.stateMachine.name
    }*

## Goal
*Define what you're building or fixing - this will be updated as requirements are gathered*

## ${this.capitalizePhase(initialPhase)}
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via \`bd\` CLI*

`;

    // Generate sections for each phase with beads-specific guidance
    for (const phase of phases) {
      if (phase !== initialPhase) {
        content += `## ${this.capitalizePhase(phase)}
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via \`bd\` CLI*

`;
      }
    }

    content += `## Key Decisions
*Important decisions will be documented here as they are made*

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
`;

    return content;
  }

  /**
   * Update plan file with new content
   */
  async updatePlanFile(planFilePath: string, content: string): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(planFilePath), { recursive: true });

    await writeFile(planFilePath, content, 'utf-8');
  }

  /**
   * Get plan file content for LLM context
   */
  async getPlanFileContent(planFilePath: string): Promise<string> {
    const planInfo = await this.getPlanFileInfo(planFilePath);

    if (!planInfo.exists) {
      return 'Plan file does not exist yet. It will be created when the LLM updates it.';
    }

    return planInfo.content || '';
  }

  /**
   * Generate phase-specific plan file guidance optimized for beads
   */
  generatePlanFileGuidance(phase: string): string {
    if (!this.stateMachine) {
      throw new Error(
        'State machine not set. This should not happen as state machine is always loaded.'
      );
    }

    const phaseDefinition = this.stateMachine.states[phase];
    if (!phaseDefinition) {
      logger.warn('Unknown phase for beads plan file guidance', { phase });
      return `Track key decisions and take notes in the plan file. Use bd CLI for all task management.`;
    }

    return `Track key decisions and take notes in the plan file. Use bd CLI exclusively for task management - never use checkboxes. Document important decisions in the Key Decisions section.`;
  }

  /**
   * Delete plan file
   */
  async deletePlanFile(planFilePath: string): Promise<boolean> {
    logger.debug('Deleting beads plan file', { planFilePath });

    try {
      // Check if file exists first
      await access(planFilePath);

      // Import unlink dynamically to avoid issues
      const { unlink } = await import('node:fs/promises');
      await unlink(planFilePath);

      logger.info('Beads plan file deleted successfully', { planFilePath });
      return true;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug('Beads plan file does not exist, nothing to delete', {
          planFilePath,
        });
        return true; // Consider it successful if file doesn't exist
      }

      logger.error('Failed to delete beads plan file', error as Error, {
        planFilePath,
      });
      throw error;
    }
  }

  /**
   * Ensure plan file is deleted (verify deletion)
   */
  async ensurePlanFileDeleted(planFilePath: string): Promise<boolean> {
    logger.debug('Ensuring beads plan file is deleted', { planFilePath });

    try {
      await access(planFilePath);
      // If we reach here, file still exists
      logger.warn('Beads plan file still exists after deletion attempt', {
        planFilePath,
      });
      return false;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug('Beads plan file successfully deleted (does not exist)', {
          planFilePath,
        });
        return true;
      }

      // Some other error occurred
      logger.error('Error checking beads plan file deletion', error as Error, {
        planFilePath,
      });
      throw error;
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

  /**
   * Generate workflow documentation URL for predefined workflows
   */
  private generateWorkflowDocumentationUrl(
    workflowName: string
  ): string | undefined {
    // Don't generate URL for custom workflows
    if (workflowName === 'custom') {
      return undefined;
    }

    // Generate URL for predefined workflows
    return `https://mrsimpson.github.io/responsible-vibe-mcp/workflows/${workflowName}`;
  }
}
