/**
 * Configuration Manager
 *
 * Handles loading and validation of project configuration from .vibe/config.yaml
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { createLogger } from './logger.js';

const logger = createLogger('ConfigManager');

export interface ProjectConfig {
  enabled_workflows?: string[];
}

/**
 * Manages project configuration loading and validation
 */
export class ConfigManager {
  private static readonly CONFIG_FILENAME = 'config.yaml';

  /**
   * Load project configuration from .vibe/config.yaml
   * Returns null if no config file exists (backward compatibility)
   * Throws error for invalid configuration
   */
  public static loadProjectConfig(projectPath: string): ProjectConfig | null {
    const configPath = path.join(projectPath, '.vibe', this.CONFIG_FILENAME);

    // No config file = backward compatibility (all workflows available)
    if (!fs.existsSync(configPath)) {
      logger.debug('No config file found, using defaults', { configPath });
      return null;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(configContent) as ProjectConfig;

      this.validateConfig(config, configPath);

      logger.info('Loaded project configuration', {
        configPath,
        enabledWorkflows: config.enabled_workflows?.length || 0,
      });

      return config;
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        throw new Error(
          `Invalid YAML in config file ${configPath}: ${error.message}`
        );
      }
      throw new Error(`Failed to load config file ${configPath}: ${error}`);
    }
  }

  /**
   * Validate configuration structure and content
   */
  private static validateConfig(
    config: ProjectConfig,
    configPath: string
  ): void {
    if (!config || typeof config !== 'object') {
      throw new Error(
        `Invalid config file ${configPath}: must be a YAML object`
      );
    }

    if (config.enabled_workflows !== undefined) {
      if (!Array.isArray(config.enabled_workflows)) {
        throw new Error(
          `Invalid config file ${configPath}: enabled_workflows must be an array`
        );
      }

      if (config.enabled_workflows.length === 0) {
        throw new Error(
          `Invalid config file ${configPath}: enabled_workflows cannot be empty`
        );
      }

      // Validate all entries are strings
      for (const workflow of config.enabled_workflows) {
        if (typeof workflow !== 'string' || workflow.trim() === '') {
          throw new Error(
            `Invalid config file ${configPath}: all workflow names must be non-empty strings`
          );
        }
      }
    }
  }
}
