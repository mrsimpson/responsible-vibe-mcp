/**
 * Server Components Factory
 *
 * Factory for creating server components based on configuration.
 * Implements strategy pattern to enable component substitution based on task backend.
 */

import {
  TaskBackendManager,
  PlanManager,
  InstructionGenerator,
  type TaskBackendConfig,
} from '@codemcp/workflows-core';

// Beads implementations
import { BeadsPlanManager } from './beads/beads-plan-manager.js';
import { BeadsInstructionGenerator } from './beads/beads-instruction-generator.js';
import { BeadsTaskBackendClient } from './beads/beads-task-backend-client.js';

export interface ComponentFactoryOptions {
  taskBackend?: TaskBackendConfig;
  projectPath?: string;
}

/**
 * Factory class for creating server components with appropriate strategy implementations
 */
export class ServerComponentsFactory {
  private taskBackend: TaskBackendConfig;
  private projectPath?: string;

  constructor(options: ComponentFactoryOptions = {}) {
    this.taskBackend =
      options.taskBackend || TaskBackendManager.detectTaskBackend();
    this.projectPath = options.projectPath;
  }

  /**
   * Create the appropriate plan manager implementation
   */
  createPlanManager(): PlanManager | BeadsPlanManager {
    if (this.taskBackend.backend === 'beads' && this.taskBackend.isAvailable) {
      return new BeadsPlanManager();
    }

    // Default markdown-based plan manager
    return new PlanManager();
  }

  /**
   * Create the appropriate instruction generator implementation
   */
  createInstructionGenerator():
    | InstructionGenerator
    | BeadsInstructionGenerator {
    if (this.taskBackend.backend === 'beads' && this.taskBackend.isAvailable) {
      return new BeadsInstructionGenerator();
    }

    // Default markdown-based instruction generator
    return new InstructionGenerator(new PlanManager());
  }

  /**
   * Create the appropriate task backend client implementation
   */
  createTaskBackendClient(): BeadsTaskBackendClient | null {
    if (
      this.taskBackend.backend === 'beads' &&
      this.taskBackend.isAvailable &&
      this.projectPath
    ) {
      return new BeadsTaskBackendClient(this.projectPath);
    }

    // No task backend client for markdown mode
    return null;
  }

  /**
   * Get the current task backend configuration
   */
  getTaskBackend(): TaskBackendConfig {
    return this.taskBackend;
  }
}
