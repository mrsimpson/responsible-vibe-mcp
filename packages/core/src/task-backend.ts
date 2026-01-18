/**
 * Task Backend Management
 *
 * Provides abstraction layer for different task management backends:
 * - markdown: Traditional plan file with checkbox tasks
 * - beads: Beads distributed issue tracker integration
 */

import { execSync } from 'node:child_process';
import { createLogger } from './logger.js';

const logger = createLogger('TaskBackend');

export type TaskBackend = 'markdown' | 'beads';

export interface TaskBackendConfig {
  backend: TaskBackend;
  isAvailable: boolean;
  errorMessage?: string;
}

/**
 * Task backend detection and management utility
 */
export class TaskBackendManager {
  /**
   * Detect and validate the requested task backend
   */
  static detectTaskBackend(): TaskBackendConfig {
    const envBackend = process.env['TASK_BACKEND']?.toLowerCase().trim();

    // Default to markdown if not set or invalid
    if (!envBackend || !['markdown', 'beads'].includes(envBackend)) {
      logger.debug('Using default markdown backend', {
        envBackend,
        reason: envBackend ? 'invalid value' : 'not set',
      });
      return {
        backend: 'markdown',
        isAvailable: true,
      };
    }

    const backend = envBackend as TaskBackend;

    if (backend === 'markdown') {
      return {
        backend: 'markdown',
        isAvailable: true,
      };
    }

    if (backend === 'beads') {
      const beadsAvailable = TaskBackendManager.checkBeadsAvailability();
      if (beadsAvailable.isAvailable) {
        return {
          backend: 'beads',
          isAvailable: true,
        };
      } else {
        return {
          backend: 'beads',
          isAvailable: false,
          errorMessage:
            beadsAvailable.errorMessage || 'Beads backend not available',
        };
      }
    }

    // Should never reach here
    return {
      backend: 'markdown',
      isAvailable: true,
    };
  }

  /**
   * Check if beads command is available and functional
   */
  private static checkBeadsAvailability(): {
    isAvailable: boolean;
    errorMessage?: string;
  } {
    try {
      // Check if bd command exists and is functional
      const output = execSync('bd --version', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 5000,
      });

      logger.debug('Beads command available', { version: output.trim() });
      return { isAvailable: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Provide helpful error message based on error type
      if (
        errorMessage.includes('command not found') ||
        errorMessage.includes('not recognized')
      ) {
        return {
          isAvailable: false,
          errorMessage:
            'Beads command (bd) not found. Please install beads from: https://github.com/beads-data/beads',
        };
      }

      if (errorMessage.includes('timeout')) {
        return {
          isAvailable: false,
          errorMessage:
            'Beads command (bd) timed out. Check if beads is properly installed and configured.',
        };
      }

      logger.warn('Beads availability check failed', { errorMessage });
      return {
        isAvailable: false,
        errorMessage: `Beads command (bd) check failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get setup instructions for beads backend
   */
  static getBeadsSetupInstructions(): string {
    return `## Beads Setup Required

To use beads as your task backend, you need to install beads:

### Installation
1. Clone the beads repository:
   \`\`\`bash
   git clone https://github.com/beads-data/beads.git ~/beads
   cd ~/beads
   \`\`\`

2. Build and install beads:
   \`\`\`bash
   make install
   \`\`\`

3. Verify installation:
   \`\`\`bash
   bd --version
   \`\`\`

### Configuration
After installation, set the task backend:
\`\`\`bash
export TASK_BACKEND=beads
\`\`\`

Then restart the responsible-vibe-mcp server and try again.

### Alternative: Use Markdown Backend
If you prefer to continue with traditional plan file task management:
\`\`\`bash
export TASK_BACKEND=markdown  # or unset TASK_BACKEND
\`\`\``;
  }

  /**
   * Validate task backend configuration and throw error if invalid
   */
  static validateTaskBackend(): TaskBackendConfig {
    const config = this.detectTaskBackend();

    if (!config.isAvailable) {
      const setupInstructions =
        config.backend === 'beads'
          ? this.getBeadsSetupInstructions()
          : 'Task backend validation failed';

      throw new Error(
        `Task backend '${config.backend}' is not available.\n\n${config.errorMessage || ''}\n\n${setupInstructions}`
      );
    }

    logger.info('Task backend validated successfully', {
      backend: config.backend,
      available: config.isAvailable,
    });

    return config;
  }
}
