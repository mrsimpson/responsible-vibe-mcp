import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createLogger } from './logger.js';

const logger = createLogger('GitManager');

export class GitManager {
  /**
   * Check if a directory is a git repository
   */
  static isGitRepository(projectPath: string): boolean {
    return existsSync(`${projectPath}/.git`);
  }

  /**
   * Get the current git branch for a project
   */
  static getCurrentBranch(projectPath: string): string {
    try {
      if (!this.isGitRepository(projectPath)) {
        logger.debug('Not a git repository, using "default" as branch name', {
          projectPath,
        });
        return 'default';
      }

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      logger.debug('Detected git branch', { projectPath, branch });
      return branch;
    } catch (_error) {
      logger.debug('Failed to get git branch, using "default" as branch name', {
        projectPath,
      });
      return 'default';
    }
  }

  /**
   * Get the current HEAD commit hash (for tracking start of development)
   */
  static getCurrentCommitHash(projectPath: string): string | null {
    try {
      if (!this.isGitRepository(projectPath)) {
        return null;
      }

      const hash = execSync('git rev-parse HEAD', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      return hash;
    } catch (error) {
      logger.debug('Failed to get current commit hash', { projectPath, error });
      return null;
    }
  }

  /**
   * Create a commit with the given message
   */
  static createCommit(message: string, projectPath: string): boolean {
    try {
      if (!this.isGitRepository(projectPath)) {
        logger.debug('Not a git repository, skipping commit', { projectPath });
        return false;
      }

      // Stage all changes
      execSync('git add .', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      // Create commit
      execSync(`git commit -m "${message}"`, {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      logger.debug('Created commit successfully', { projectPath, message });
      return true;
    } catch (error) {
      logger.debug('Failed to create commit', {
        projectPath,
        message,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  static hasUncommittedChanges(projectPath: string): boolean {
    try {
      if (!this.isGitRepository(projectPath)) {
        logger.debug('Not a git repository, no uncommitted changes', {
          projectPath,
        });
        return false;
      }

      const status = execSync('git status --porcelain', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      const hasChanges = status.length > 0;
      logger.debug('Checked for uncommitted changes', {
        projectPath,
        hasChanges,
      });
      return hasChanges;
    } catch (error) {
      logger.debug('Failed to check for uncommitted changes', {
        projectPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
