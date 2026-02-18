/**
 * Platform-specific skill output paths
 *
 * This module defines the output paths for skill files across different AI platforms.
 * Used by SkillGenerator classes to determine where to write skill/power files
 * and their associated MCP configurations.
 */

import { join } from 'node:path';

/**
 * Paths configuration for a platform's skill files
 */
export interface SkillPaths {
  /** Directory containing SKILL.md (or POWER.md for Kiro) */
  skillDir: string;
  /** Full path to SKILL.md or POWER.md */
  skillFile: string;
  /** Path to MCP config file */
  mcpConfigPath: string;
  /** Key within config if nested (e.g., 'mcpServers') */
  mcpConfigKey?: string;
  /** True if using Power format (Kiro-specific) */
  isKiroPower: boolean;
}

/**
 * Supported platforms for skill generation
 */
export type SkillPlatform =
  | 'claude'
  | 'opencode'
  | 'kiro'
  | 'copilot'
  | 'gemini';

/**
 * Get skill paths for a specific platform
 *
 * @param platform - The target platform
 * @param outputDir - Base output directory (usually project root)
 * @returns SkillPaths configuration for the platform
 * @throws Error if platform is not supported
 */
export function getSkillPaths(platform: string, outputDir: string): SkillPaths {
  const normalizedPlatform = platform.toLowerCase();

  switch (normalizedPlatform) {
    case 'claude': {
      const skillDir = join(outputDir, '.claude', 'skills', 'responsible-vibe');
      return {
        skillDir,
        skillFile: join(skillDir, 'SKILL.md'),
        mcpConfigPath: join(outputDir, '.mcp.json'),
        mcpConfigKey: 'mcpServers',
        isKiroPower: false,
      };
    }

    case 'opencode': {
      const skillDir = join(
        outputDir,
        '.opencode',
        'skills',
        'responsible-vibe'
      );
      return {
        skillDir,
        skillFile: join(skillDir, 'SKILL.md'),
        mcpConfigPath: join(outputDir, 'opencode.json'),
        mcpConfigKey: 'mcp',
        isKiroPower: false,
      };
    }

    case 'kiro': {
      // Kiro uses "powers" instead of "skills" and bundles MCP config
      const skillDir = join(outputDir, '.kiro', 'powers', 'responsible-vibe');
      return {
        skillDir,
        skillFile: join(skillDir, 'POWER.md'),
        mcpConfigPath: join(skillDir, 'mcp.json'),
        // mcpConfigKey omitted - MCP config is at root level
        isKiroPower: true,
      };
    }

    case 'copilot': {
      const skillDir = join(outputDir, '.github', 'skills', 'responsible-vibe');
      return {
        skillDir,
        skillFile: join(skillDir, 'SKILL.md'),
        mcpConfigPath: join(outputDir, '.vscode', 'mcp.json'),
        mcpConfigKey: 'servers',
        isKiroPower: false,
      };
    }

    case 'gemini': {
      const skillDir = join(outputDir, '.gemini', 'skills', 'responsible-vibe');
      return {
        skillDir,
        skillFile: join(skillDir, 'SKILL.md'),
        mcpConfigPath: join(outputDir, 'settings.json'),
        mcpConfigKey: 'mcpServers',
        isKiroPower: false,
      };
    }

    default:
      throw new Error(
        `Unsupported skill platform: ${platform}. Supported platforms: claude, opencode, kiro, copilot, gemini`
      );
  }
}

/**
 * Get all supported skill platforms
 */
export function getSupportedSkillPlatforms(): SkillPlatform[] {
  return ['claude', 'opencode', 'kiro', 'copilot', 'gemini'];
}

/**
 * Check if a platform is supported for skill generation
 */
export function isSkillPlatformSupported(platform: string): boolean {
  return getSupportedSkillPlatforms().includes(
    platform.toLowerCase() as SkillPlatform
  );
}
