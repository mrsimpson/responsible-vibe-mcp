/**
 * Beads Integration Utilities
 *
 * Provides utilities for integrating with beads distributed issue tracker:
 * - Project epic creation
 * - Phase task management
 * - Task hierarchy setup
 */

import { execSync } from 'node:child_process';
import { createLogger } from './logger.js';
import { YamlState } from './state-machine-types.js';

const logger = createLogger('BeadsIntegration');

export interface BeadsTaskInfo {
  id: string;
  title: string;
  status: string;
  parent?: string;
}

export interface BeadsPhaseTask {
  phaseId: string;
  phaseName: string;
  taskId: string;
}

/**
 * Beads integration manager for responsible-vibe-mcp
 */
export class BeadsIntegration {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Ensure beads is initialized in the project directory
   */
  private async ensureBeadsInitialized(): Promise<void> {
    try {
      // Check if beads is already initialized by running a simple command
      execSync('bd list --limit 1', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // If we get here, beads is already initialized
      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if the error suggests beads is not initialized
      if (
        errorMessage.includes('not initialized') ||
        errorMessage.includes('no database') ||
        errorMessage.includes('init')
      ) {
        logger.info('Beads not initialized, running bd init --no-db', {
          projectPath: this.projectPath,
        });

        try {
          // Initialize beads without database
          execSync('bd init --no-db', {
            cwd: this.projectPath,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          logger.info('Successfully initialized beads in project', {
            projectPath: this.projectPath,
          });
        } catch (initError) {
          const initErrorMessage =
            initError instanceof Error ? initError.message : String(initError);
          logger.error(
            'Failed to initialize beads',
            initError instanceof Error
              ? initError
              : new Error(initErrorMessage),
            { projectPath: this.projectPath }
          );
          throw new Error(`Failed to initialize beads: ${initErrorMessage}`);
        }
      } else {
        // Some other beads error, re-throw
        throw error;
      }
    }
  }

  /**
   * Create a project epic in beads for the development session
   */
  async createProjectEpic(
    projectName: string,
    workflowName: string
  ): Promise<string> {
    // Validate parameters first
    this.validateCreateEpicParameters(projectName, workflowName);

    // Ensure beads is initialized
    await this.ensureBeadsInitialized();

    const epicTitle = `Responsible-Vibe Development: ${projectName}`;
    const epicDescription = `Development session using ${workflowName} workflow for ${projectName}`;
    const priority = 2;

    const command = `bd create "${epicTitle}" --description "${epicDescription}" --priority ${priority}`;

    logger.debug('Creating beads project epic', {
      command,
      projectName,
      workflowName,
      projectPath: this.projectPath,
    });

    try {
      const output = execSync(command, {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Extract task ID from beads output
      // Support both new format (v0.47.1+): "✓ Created issue: project-name-123"
      // and legacy format: "Created bd-a1b2c3"
      const match =
        output.match(/✓ Created issue: ([\w\d.-]+)/) ||
        output.match(/Created issue: ([\w\d.-]+)/) ||
        output.match(/Created (bd-[\w\d.]+)/);
      if (!match) {
        logger.warn('Failed to extract task ID from beads output', {
          command: `bd create "${epicTitle}" --description "${epicDescription}" --priority 2`,
          output: output.slice(0, 200), // Truncated for logging
        });
        throw new Error(
          `Failed to extract task ID from beads output: ${output.slice(0, 100)}...`
        );
      }

      const epicId = match[1] || '';
      logger.info('Created beads project epic', {
        epicId,
        epicTitle,
        projectPath: this.projectPath,
      });
      return epicId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const commandInfo = {
        command,
        projectName,
        workflowName,
        projectPath: this.projectPath,
      };

      logger.error(
        'Failed to create beads project epic',
        error instanceof Error ? error : new Error(errorMessage),
        commandInfo
      );

      // Include stderr if available for better debugging
      const execError = error as unknown as { stderr?: string };
      if (execError?.stderr) {
        logger.error(
          'Beads command stderr output',
          new Error('Command stderr'),
          {
            stderr: execError.stderr.toString(),
            ...commandInfo,
          }
        );
      }

      throw new Error(`Failed to create beads project epic: ${errorMessage}`);
    }
  }

  /**
   * Create phase tasks for all workflow phases under the project epic
   */
  async createPhaseTasks(
    epicId: string,
    phases: Record<string, YamlState>,
    workflowName: string
  ): Promise<BeadsPhaseTask[]> {
    // Validate parameters
    this.validateCreatePhaseParameters(epicId, phases, workflowName);

    const phaseTasks: BeadsPhaseTask[] = [];
    const phaseNames = Object.keys(phases);

    for (const phase of phaseNames) {
      const phaseTitle = `${this.capitalizePhase(phase)}`;
      const priority = 3;
      const stateDefinition = phases[phase];

      // Escape the description to prevent shell injection and handle special characters
      const description = (
        stateDefinition?.default_instructions ||
        `${workflowName} workflow ${phase} phase tasks`
      )
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, '') // Remove carriage returns
        .trim();

      const command = `bd create "${phaseTitle}" --description "${description}" --parent ${epicId} --priority ${priority}`;

      logger.debug('Creating beads phase task', {
        command,
        phase,
        epicId,
        projectPath: this.projectPath,
      });

      try {
        const output = execSync(command, {
          cwd: this.projectPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        // Extract task ID from beads output
        // Support both new format (v0.47.1+): "✓ Created issue: project-name-123"
        // and legacy format: "Created bd-a1b2c3"
        const match =
          output.match(/✓ Created issue: ([\w\d.-]+)/) ||
          output.match(/Created issue: ([\w\d.-]+)/) ||
          output.match(/Created (bd-[\w\d.]+)/);
        if (!match) {
          logger.warn('Failed to extract phase task ID from beads output', {
            command,
            output: output.slice(0, 200), // Truncated for logging
          });
          throw new Error(
            `Failed to extract task ID from beads output: ${output.slice(0, 100)}...`
          );
        }

        const phaseTaskId = match[1] || '';
        phaseTasks.push({
          phaseId: phase,
          phaseName: phaseTitle,
          taskId: phaseTaskId,
        });

        logger.debug('Created beads phase task', {
          phase,
          phaseTaskId,
          epicId,
          projectPath: this.projectPath,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const commandInfo = {
          command,
          phase,
          epicId,
          projectPath: this.projectPath,
        };

        logger.error(
          'Failed to create beads phase task',
          error instanceof Error ? error : new Error(errorMessage),
          commandInfo
        );

        // Include stderr if available for better debugging
        const execError = error as unknown as { stderr?: string };
        if (execError?.stderr) {
          logger.error(
            'Beads phase command stderr output',
            new Error('Command stderr'),
            {
              stderr: execError.stderr.toString(),
              ...commandInfo,
            }
          );
        }

        throw new Error(
          `Failed to create beads phase task for ${phase}: ${errorMessage}`
        );
      }
    }

    logger.info('Created all beads phase tasks', {
      count: phaseTasks.length,
      epicId,
      projectPath: this.projectPath,
    });
    return phaseTasks;
  }

  /**
   * Create sequential dependencies between workflow phase tasks
   */
  async createPhaseDependencies(phaseTasks: BeadsPhaseTask[]): Promise<void> {
    if (phaseTasks.length < 2) {
      logger.debug('Skipping phase dependencies - less than 2 phases', {
        phaseCount: phaseTasks.length,
        projectPath: this.projectPath,
      });
      return;
    }

    logger.info('Creating sequential phase dependencies', {
      phaseCount: phaseTasks.length,
      projectPath: this.projectPath,
    });

    // Create dependencies in sequence: each phase blocks the next one
    for (let i = 0; i < phaseTasks.length - 1; i++) {
      const currentPhase = phaseTasks[i];
      const nextPhase = phaseTasks[i + 1];

      if (!currentPhase || !nextPhase) {
        logger.warn('Skipping phase dependency - missing phase data', {
          currentPhaseIndex: i,
          nextPhaseIndex: i + 1,
          totalPhases: phaseTasks.length,
          projectPath: this.projectPath,
        });
        continue;
      }

      const command = `bd dep ${currentPhase.taskId} --blocks ${nextPhase.taskId}`;

      logger.debug('Creating phase dependency', {
        command,
        currentPhase: currentPhase.phaseName,
        nextPhase: nextPhase.phaseName,
        currentTaskId: currentPhase.taskId,
        nextTaskId: nextPhase.taskId,
        projectPath: this.projectPath,
      });

      try {
        execSync(command, {
          cwd: this.projectPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        logger.debug('Successfully created phase dependency', {
          currentPhase: currentPhase.phaseName,
          nextPhase: nextPhase.phaseName,
          projectPath: this.projectPath,
        });
      } catch (error) {
        // Log as warning but don't fail the entire setup
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.warn('Failed to create phase dependency', {
          error: errorMessage,
          command,
          currentPhase: currentPhase.phaseName,
          nextPhase: nextPhase.phaseName,
          projectPath: this.projectPath,
        });

        // Include stderr if available for better debugging
        const execError = error as unknown as { stderr?: string };
        if (execError?.stderr) {
          logger.warn('Beads dependency command stderr', {
            stderr: execError.stderr.toString(),
            command,
            projectPath: this.projectPath,
          });
        }
      }
    }

    logger.info('Completed phase dependency creation', {
      dependencyCount: phaseTasks.length - 1,
      projectPath: this.projectPath,
    });
  }

  /**
   * Get beads task information
   */
  async getTaskInfo(taskId: string): Promise<BeadsTaskInfo | null> {
    try {
      const output = execSync(`bd show ${taskId}`, {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Parse basic info from output (this is a simplified parser)
      const lines = output.split('\n');
      const titleLine = lines.find(line => line.includes('Title:'));
      const statusLine = lines.find(line => line.includes('Status:'));

      if (!titleLine) {
        return null;
      }

      const title = titleLine.split('Title:')[1]?.trim() || taskId;
      const status = statusLine?.split('Status:')[1]?.trim() || 'unknown';

      return {
        id: taskId,
        title,
        status,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn('Failed to get beads task info', {
        error: errorMessage,
        taskId,
        projectPath: this.projectPath,
      });
      return null;
    }
  }

  /**
   * Generate beads tool instructions for whats_next() responses
   */
  generateBeadsInstructions(
    currentPhaseTaskId: string,
    phaseName: string
  ): string {
    return `
**🔧 BD CLI Task Management:**

You are currently in the ${phaseName} phase. All work items should be created as children of ${currentPhaseTaskId}.

**Focus on ${phaseName} Phase Tasks** (subtasks of \`${currentPhaseTaskId}\`):
• \`bd list --parent ${currentPhaseTaskId} --status open\` - List ready work items
• \`bd update <task-id> --status in_progress\` - Start working on a specific task
• \`bd close <task-id>\` - Mark task complete when finished
• \`bd show ${currentPhaseTaskId}\` - View phase and its work items

**Create New Tasks for Current Phase**:
• \`bd create 'Task title' --parent ${currentPhaseTaskId} --description '<A brief description of the intention and a list of acceptance criteria>' --priority <priority denotes an urgency>\` - Create work item with rich description
• **Example**: \`bd create 'Fix user authentication bug' --parent ${currentPhaseTaskId} --description 'Resolve login failure when users have special characters in passwords. \nAcceptance criteria:\n- Users with special characters can log in successfully\n- Input validation is updated\n- Tests cover edge cases' --priority 1\`

**If you need to create tasks for other phases** (get parent task IDs from plan file):
• Check plan file for phase task IDs: <!-- beads-phase-id: task-xyz123 -->
• Create tasks for other phases using their parent IDs

**Immediate Action**: Run \`bd list --parent ${currentPhaseTaskId} --status open\` to see ready tasks.`;
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
   * Validate parameters for epic creation
   */
  private validateCreateEpicParameters(
    projectName: string,
    workflowName: string
  ): void {
    if (
      !projectName ||
      typeof projectName !== 'string' ||
      projectName.trim() === ''
    ) {
      throw new Error('Project name is required and cannot be empty');
    }

    if (
      !workflowName ||
      typeof workflowName !== 'string' ||
      workflowName.trim() === ''
    ) {
      throw new Error('Workflow name is required and cannot be empty');
    }
  }

  /**
   * Validate parameters for phase task creation
   */
  private validateCreatePhaseParameters(
    epicId: string,
    phases: Record<string, YamlState>,
    workflowName: string
  ): void {
    if (!epicId || typeof epicId !== 'string' || epicId.trim() === '') {
      throw new Error('Epic ID is required and cannot be empty');
    }

    if (
      !phases ||
      typeof phases !== 'object' ||
      Object.keys(phases).length === 0
    ) {
      throw new Error('Phases object is required and cannot be empty');
    }

    if (
      !workflowName ||
      typeof workflowName !== 'string' ||
      workflowName.trim() === ''
    ) {
      throw new Error('Workflow name is required and cannot be empty');
    }

    // Validate each phase
    for (const [phaseName, phaseState] of Object.entries(phases)) {
      if (
        !phaseName ||
        typeof phaseName !== 'string' ||
        phaseName.trim() === ''
      ) {
        throw new Error(
          `Invalid phase name: "${phaseName}" - phase names must be non-empty strings`
        );
      }

      if (!phaseState || typeof phaseState !== 'object') {
        throw new Error(
          `Invalid phase state for "${phaseName}" - phase states must be objects`
        );
      }

      if (
        !phaseState.default_instructions ||
        typeof phaseState.default_instructions !== 'string'
      ) {
        throw new Error(
          `Invalid phase state for "${phaseName}" - default_instructions must be a non-empty string`
        );
      }
    }
  }

  /**
   * Create entrance criteria tasks as dependencies for a phase
   */
  async createEntranceCriteriaTasks(
    phaseTaskId: string,
    entranceCriteria: string[]
  ): Promise<string[]> {
    const createdTaskIds: string[] = [];

    for (const criterion of entranceCriteria) {
      try {
        const taskTitle = `Entrance Criterion: ${criterion}`;
        const command = `bd create "${taskTitle}" --parent ${phaseTaskId} -p 1`;

        const output = execSync(command, {
          cwd: this.projectPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        // Extract task ID from beads output
        const match = output.match(/✓ Created issue: ([\w\d.-]+)/);
        const taskId = match?.[1] || '';

        if (taskId) {
          createdTaskIds.push(taskId);
          logger.info('Created entrance criterion task', {
            phaseTaskId,
            criterion,
            taskId,
            projectPath: this.projectPath,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          'Failed to create entrance criterion task',
          error instanceof Error ? error : new Error(errorMessage),
          {
            phaseTaskId,
            criterion,
            projectPath: this.projectPath,
          }
        );
        // Continue with other criteria even if one fails
      }
    }

    // Set phase task to depend on all entrance criteria tasks
    if (createdTaskIds.length > 0) {
      try {
        for (const taskId of createdTaskIds) {
          const dependencyCommand = `bd update ${phaseTaskId} --blocks ${taskId}`;
          execSync(dependencyCommand, {
            cwd: this.projectPath,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        }

        logger.info('Set phase dependencies on entrance criteria', {
          phaseTaskId,
          dependencyTasks: createdTaskIds,
          projectPath: this.projectPath,
        });
      } catch (error) {
        logger.error(
          'Failed to set phase dependencies',
          error instanceof Error ? error : new Error(String(error)),
          {
            phaseTaskId,
            dependencyTasks: createdTaskIds,
            projectPath: this.projectPath,
          }
        );
      }
    }

    return createdTaskIds;
  }
}
