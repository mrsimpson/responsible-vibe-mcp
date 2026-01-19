/**
 * Version Information Utility
 *
 * Provides version information for the MCP server, supporting both
 * build-time injection and runtime determination for local development.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@codemcp/workflows-core';

const logger = createLogger('VersionInfo');

/**
 * Structure for version information
 */
export interface VersionInfo {
  /** The semantic version (e.g., "4.8.0") */
  version: string;
  /** Git commit hash (short form, e.g., "bbb06ba") */
  commit?: string;
  /** Whether working directory has uncommitted changes */
  isDirty?: boolean;
  /** Full git describe output (e.g., "v4.8.0-1-gbbb06ba-dirty") */
  gitDescribe?: string;
  /** Source of version information */
  source: 'package.json' | 'git' | 'build-time' | 'fallback';
}

/**
 * Build-time version information (injected during build process)
 * This will be replaced by the build system with actual values
 */
// @ts-ignore - This is replaced at build time
const BUILD_TIME_VERSION: VersionInfo | null = null;

/**
 * Gets version information from package.json
 */
function getVersionFromPackageJson(): VersionInfo | null {
  try {
    // Get the directory of this module
    const currentDir = dirname(fileURLToPath(import.meta.url));

    // Try to find package.json - first in the mcp-server package, then root
    const packageJsonPaths = [
      join(currentDir, '..', 'package.json'),
      join(currentDir, '..', '..', '..', 'package.json'),
    ];

    for (const packageJsonPath of packageJsonPaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.version) {
          logger.debug('Found version in package.json', {
            path: packageJsonPath,
            version: packageJson.version,
          });

          return {
            version: packageJson.version,
            source: 'package.json',
          };
        }
      } catch (error) {
        logger.debug('Could not read package.json', {
          path: packageJsonPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  } catch (error) {
    logger.debug('Error getting version from package.json', { error });
    return null;
  }
}

/**
 * Gets version information from git
 */
function getVersionFromGit(): VersionInfo | null {
  try {
    // Get git describe output
    const gitDescribe = execSync('git describe --tags --always --dirty', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    logger.debug('Git describe output', { gitDescribe });

    // Parse git describe output (e.g., "v4.8.0-1-gbbb06ba-dirty")
    const isDirty = gitDescribe.endsWith('-dirty');
    const cleanDescribe = isDirty ? gitDescribe.slice(0, -6) : gitDescribe;

    // Try to extract version and commit
    const parts = cleanDescribe.split('-');
    let version: string;
    let commit: string | undefined;

    if (parts.length >= 3 && parts[0]?.startsWith('v')) {
      // Format: v4.8.0-1-gbbb06ba
      version = parts[0].slice(1); // Remove 'v' prefix
      commit = parts[2]?.startsWith('g') ? parts[2].slice(1) : parts[2];
    } else if (parts.length === 1 && parts[0]?.startsWith('v')) {
      // Format: v4.8.0 (exact tag)
      version = parts[0].slice(1);
    } else if (parts.length === 1) {
      // Format: commit hash only
      version = 'unknown';
      commit = parts[0];
    } else {
      // Fallback
      version = 'unknown';
    }

    return {
      version,
      commit,
      isDirty,
      gitDescribe,
      source: 'git',
    };
  } catch (error) {
    logger.debug('Error getting version from git', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Gets comprehensive version information, trying multiple sources
 */
export function getVersionInfo(): VersionInfo {
  logger.debug('Determining version information');

  // Try build-time version first (will be null in development)
  if (BUILD_TIME_VERSION) {
    logger.info('Using build-time version information', {
      version: BUILD_TIME_VERSION.version,
      source: BUILD_TIME_VERSION.source,
    });
    return BUILD_TIME_VERSION;
  }

  // Try git version info (best for development)
  const gitVersion = getVersionFromGit();
  if (gitVersion) {
    // If we have git info, try to enhance with package.json version
    const packageVersion = getVersionFromPackageJson();
    if (packageVersion && gitVersion.version === 'unknown') {
      logger.info('Using package.json version with git commit info', {
        version: packageVersion.version,
        commit: gitVersion.commit || 'unknown',
        isDirty: String(gitVersion.isDirty || false),
      });

      return {
        ...gitVersion,
        version: packageVersion.version,
        source: 'git' as const,
      };
    }

    logger.info('Using git version information', {
      version: gitVersion.version,
      source: gitVersion.source,
      commit: gitVersion.commit || 'none',
      isDirty: String(gitVersion.isDirty || false),
    });
    return gitVersion;
  }

  // Fallback to package.json only
  const packageVersion = getVersionFromPackageJson();
  if (packageVersion) {
    logger.info('Using package.json version information', {
      version: packageVersion.version,
      source: packageVersion.source,
    });
    return packageVersion;
  }

  // Final fallback
  logger.warn('Could not determine version information, using fallback');
  return {
    version: 'unknown',
    source: 'fallback',
  };
}

/**
 * Gets a formatted version string suitable for display
 */
export function getFormattedVersion(): string {
  const versionInfo = getVersionInfo();

  let formatted = versionInfo.version;

  if (versionInfo.commit) {
    formatted += `+${versionInfo.commit}`;
  }

  if (versionInfo.isDirty) {
    formatted += '.dirty';
  }

  return formatted;
}
