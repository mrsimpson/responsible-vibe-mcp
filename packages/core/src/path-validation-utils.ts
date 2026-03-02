/**
 * Path Validation Utilities
 *
 * Provides utilities for validating file paths, resolving relative paths,
 * and ensuring security constraints for the file linking functionality.
 */

import { access, stat } from 'node:fs/promises';
import { resolve, isAbsolute, join, normalize, basename } from 'node:path';
import { createLogger } from './logger.js';

const logger = createLogger('PathValidationUtils');

export interface PathValidationResult {
  isValid: boolean;
  resolvedPath?: string;
  error?: string;
}

export class PathValidationUtils {
  /**
   * Validate if a string is a known template name
   */
  static isTemplateName(value: string, availableTemplates: string[]): boolean {
    return availableTemplates.includes(value);
  }

  /**
   * Validate and resolve a file path
   */
  static async validateFilePath(
    filePath: string,
    projectPath: string
  ): Promise<PathValidationResult> {
    try {
      // Resolve the path to absolute
      const resolvedPath = this.resolvePath(filePath, projectPath);

      // Security validation - prevent directory traversal
      if (!this.isPathSafe(resolvedPath, projectPath)) {
        return {
          isValid: false,
          error: 'Path is outside project boundaries for security reasons',
        };
      }

      // Check if file exists and is readable
      await access(resolvedPath);

      // Verify it's a file (not a directory)
      const stats = await stat(resolvedPath);
      if (!stats.isFile()) {
        return {
          isValid: false,
          error: 'Path points to a directory, not a file',
        };
      }

      logger.debug('File path validated successfully', {
        originalPath: filePath,
        resolvedPath,
      });

      return {
        isValid: true,
        resolvedPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.debug('File path validation failed', {
        filePath,
        error: errorMessage,
      });

      return {
        isValid: false,
        error: `File not found or not accessible: ${errorMessage}`,
      };
    }
  }

  /**
   * Validate and resolve a file or directory path
   */
  static async validateFileOrDirectoryPath(
    filePath: string,
    projectPath: string
  ): Promise<PathValidationResult> {
    try {
      // Resolve the path to absolute
      const resolvedPath = this.resolvePath(filePath, projectPath);

      // Security validation - prevent directory traversal
      if (!this.isPathSafe(resolvedPath, projectPath)) {
        return {
          isValid: false,
          error: 'Path is outside project boundaries for security reasons',
        };
      }

      // Check if file or directory exists and is readable
      await access(resolvedPath);

      // Verify it's either a file or directory
      const stats = await stat(resolvedPath);
      if (!stats.isFile() && !stats.isDirectory()) {
        return {
          isValid: false,
          error: 'Path is neither a file nor a directory',
        };
      }

      logger.debug('File or directory path validated successfully', {
        originalPath: filePath,
        resolvedPath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      });

      return {
        isValid: true,
        resolvedPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.debug('File or directory path validation failed', {
        filePath,
        error: errorMessage,
      });

      return {
        isValid: false,
        error: `File or directory not found or not accessible: ${errorMessage}`,
      };
    }
  }

  /**
   * Resolve a file path to absolute, handling various formats
   */
  static resolvePath(filePath: string, projectPath: string): string {
    // If already absolute, return as-is
    if (isAbsolute(filePath)) {
      return normalize(filePath);
    }

    // Handle relative paths (./file, ../file, file)
    return resolve(projectPath, filePath);
  }

  /**
   * Check if a resolved path is within safe boundaries
   * Prevents directory traversal attacks
   */
  static isPathSafe(resolvedPath: string, projectPath: string): boolean {
    const normalizedResolved = normalize(resolvedPath);
    const normalizedProject = normalize(projectPath);

    // Allow paths within the project directory
    if (normalizedResolved.startsWith(normalizedProject)) {
      return true;
    }

    // Allow paths in common documentation locations relative to project
    const allowedPaths = [
      normalize(join(projectPath, '..')), // Parent directory (for monorepos)
      '/usr/share/doc', // System documentation
      '/opt/docs', // Optional documentation
    ];

    return allowedPaths.some(allowedPath =>
      normalizedResolved.startsWith(allowedPath)
    );
  }

  /**
   * Validate parameter as either template name or file path
   */
  static async validateParameter(
    value: string,
    availableTemplates: string[],
    projectPath: string
  ): Promise<{
    isTemplate: boolean;
    isFilePath: boolean;
    resolvedPath?: string;
    error?: string;
  }> {
    // First check if it's a template name
    if (this.isTemplateName(value, availableTemplates)) {
      return {
        isTemplate: true,
        isFilePath: false,
      };
    }

    // Then validate as file or directory path
    const pathValidation = await this.validateFileOrDirectoryPath(
      value,
      projectPath
    );

    if (pathValidation.isValid) {
      return {
        isTemplate: false,
        isFilePath: true,
        resolvedPath: pathValidation.resolvedPath,
      };
    }

    // Neither template nor valid file/directory path
    return {
      isTemplate: false,
      isFilePath: false,
      error: `Invalid parameter: not a known template (${availableTemplates.join(', ')}) and not a valid file or directory path (${pathValidation.error})`,
    };
  }

  /**
   * Get common file patterns for documentation
   */
  static getCommonDocumentationPatterns(): {
    architecture: string[];
    requirements: string[];
    design: string[];
  } {
    return {
      architecture: [
        'ARCHITECTURE.md',
        'ARCHITECTURE.txt',
        'architecture.md',
        'Architecture.md',
        'docs/ARCHITECTURE.md',
        'docs/architecture.md',
        'README.md', // Can contain architecture info
      ],
      requirements: [
        'REQUIREMENTS.md',
        'REQUIREMENTS.txt',
        'requirements.md',
        'Requirements.md',
        'docs/REQUIREMENTS.md',
        'docs/requirements.md',
        'README.md', // Often contains requirements
      ],
      design: [
        'DESIGN.md',
        'DESIGN.txt',
        'design.md',
        'Design.md',
        'docs/DESIGN.md',
        'docs/design.md',
        'README.md', // Can contain design info
      ],
    };
  }
}

/**
 * Cross-platform utility to extract the last component of a path.
 * Handles both forward slashes (/) and backslashes (\) regardless of
 * the platform the code is running on.
 *
 * Note: Node.js's `path.basename()` only handles the native path separator
 * for the current platform. This function normalizes paths to handle both
 * Unix and Windows paths on any platform.
 *
 * @param filePath - The file path to extract from
 * @param fallback - Fallback value if path is empty (default: 'unknown')
 * @returns The last component of the path, or the fallback value
 *
 * @example
 * // Unix-style paths
 * getPathBasename('/home/user/project') // 'project'
 *
 * // Windows-style paths (works on any platform)
 * getPathBasename('c:\\work\\project') // 'project'
 *
 * // Mixed paths
 * getPathBasename('c:/work/project') // 'project'
 */
export function getPathBasename(
  filePath: string,
  fallback: string = 'unknown'
): string {
  if (!filePath) {
    return fallback;
  }

  // Normalize backslashes to forward slashes for cross-platform support
  // This ensures Windows paths are handled correctly on Unix and vice versa
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Remove trailing slashes
  const trimmedPath = normalizedPath.replace(/\/+$/, '');

  // Use basename on the normalized path
  const result = basename(trimmedPath);
  return result || fallback;
}
