/**
 * Workflow Manager
 *
 * Manages multiple predefined workflows and provides workflow discovery and selection
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createLogger } from './logger.js';
import { DEFAULT_WORKFLOW_NAME } from './constants.js';
import { StateMachineLoader } from './state-machine-loader.js';
import { YamlStateMachine } from './state-machine-types.js';
import { ConfigManager } from './config-manager.js';

const logger = createLogger('WorkflowManager');

export interface WorkflowInfo {
  name: string;
  displayName: string;
  description: string;
  initialState: string;
  phases: string[];
  // Enhanced metadata for better discoverability
  metadata?: {
    domain?: string;
    complexity?: 'low' | 'medium' | 'high';
    bestFor?: string[];
    useCases?: string[];
    examples?: string[];
  };
}

/**
 * Manages predefined workflows and provides workflow discovery
 */
export class WorkflowManager {
  private predefinedWorkflows: Map<string, YamlStateMachine> = new Map();
  private projectWorkflows: Map<string, YamlStateMachine> = new Map();
  private workflowInfos: Map<string, WorkflowInfo> = new Map();
  private stateMachineLoader: StateMachineLoader;
  private enabledDomains: Set<string>;

  constructor() {
    this.stateMachineLoader = new StateMachineLoader();
    this.enabledDomains = this.parseEnabledDomains();
    this.loadPredefinedWorkflows();
  }

  /**
   * Parse enabled domains from environment variable
   */
  private parseEnabledDomains(): Set<string> {
    const domainsEnv = process.env.VIBE_WORKFLOW_DOMAINS;
    if (!domainsEnv) {
      return new Set(['code']);
    }

    return new Set(
      domainsEnv
        .split(',')
        .map(d => d.trim())
        .filter(d => d)
    );
  }

  /**
   * Load project-specific workflows from .vibe/workflows/
   */
  public loadProjectWorkflows(projectPath: string): void {
    const workflowsDir = path.join(projectPath, '.vibe', 'workflows');

    if (!fs.existsSync(workflowsDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(workflowsDir);
      const yamlFiles = files.filter(
        file => file.endsWith('.yaml') || file.endsWith('.yml')
      );

      for (const file of yamlFiles) {
        try {
          const filePath = path.join(workflowsDir, file);
          const workflow = this.stateMachineLoader.loadFromFile(filePath);
          const workflowName = workflow.name; // Use name from YAML, not filename

          // Project workflows are always loaded (no domain filtering)
          this.projectWorkflows.set(workflowName, workflow);

          const workflowInfo: WorkflowInfo = {
            name: workflowName,
            displayName: workflow.name,
            description: workflow.description,
            initialState: workflow.initial_state,
            phases: Object.keys(workflow.states),
            metadata: workflow.metadata,
          };

          this.workflowInfos.set(workflowName, workflowInfo);

          logger.info('Loaded project workflow', {
            name: workflowName,
            domain: workflow.metadata?.domain,
          });
        } catch (error) {
          logger.error('Failed to load project workflow', error as Error, {
            file,
          });
        }
      }
    } catch (error) {
      logger.error(
        'Failed to scan project workflows directory',
        error as Error,
        { workflowsDir }
      );
    }
  }
  /**
   * Get all available workflows regardless of domain filtering
   */
  public getAllAvailableWorkflows(): WorkflowInfo[] {
    // Create a temporary manager with all domains enabled
    const originalEnv = process.env.VIBE_WORKFLOW_DOMAINS;
    process.env.VIBE_WORKFLOW_DOMAINS = 'code,architecture,office';

    try {
      const tempManager = new WorkflowManager();
      return tempManager.getAvailableWorkflows();
    } finally {
      if (originalEnv !== undefined) {
        process.env.VIBE_WORKFLOW_DOMAINS = originalEnv;
      } else {
        delete process.env.VIBE_WORKFLOW_DOMAINS;
      }
    }
  }

  public getAvailableWorkflows(): WorkflowInfo[] {
    return Array.from(this.workflowInfos.values());
  }

  /**
   * Get available workflows for a specific project
   * Applies configuration filtering and loads project-specific workflows
   */
  public getAvailableWorkflowsForProject(projectPath: string): WorkflowInfo[] {
    // Load project workflows first
    this.loadProjectWorkflows(projectPath);

    const allWorkflows = this.getAvailableWorkflows();

    // Load project configuration
    const config = ConfigManager.loadProjectConfig(projectPath);

    // Apply configuration filtering if enabled_workflows is specified
    let filteredWorkflows = allWorkflows;
    if (config?.enabled_workflows) {
      // Validate that all configured workflows exist
      for (const workflowName of config.enabled_workflows) {
        if (
          workflowName !== 'custom' &&
          !this.isPredefinedWorkflow(workflowName)
        ) {
          throw new Error(
            `Invalid workflow '${workflowName}' in configuration. Available workflows: ${this.getWorkflowNames().join(', ')}, custom`
          );
        }
      }

      // Filter to only enabled workflows
      filteredWorkflows = allWorkflows.filter(
        w => config.enabled_workflows?.includes(w.name) ?? false
      );
    }

    // Handle custom workflow (only if custom is in enabled list or no config)
    const customEnabled =
      !config?.enabled_workflows || config.enabled_workflows.includes('custom');
    if (customEnabled) {
      const hasCustomWorkflow = this.validateWorkflowName(
        'custom',
        projectPath
      );
      if (hasCustomWorkflow) {
        // Add custom workflow to the list if it exists and is enabled
        const customWorkflowInfo: WorkflowInfo = {
          name: 'custom',
          displayName: 'Custom Workflow',
          description: 'Project-specific custom workflow',
          initialState: 'unknown', // Will be determined when loaded
          phases: [], // Will be determined when loaded
        };
        filteredWorkflows.push(customWorkflowInfo);
      }
    }

    return filteredWorkflows;
  }

  /**
   * Get workflow information by name
   */
  public getWorkflowInfo(name: string): WorkflowInfo | undefined {
    return this.workflowInfos.get(name);
  }

  /**
   * Get a specific workflow by name (checks both predefined and project workflows)
   */
  public getWorkflow(name: string): YamlStateMachine | undefined {
    return (
      this.projectWorkflows.get(name) || this.predefinedWorkflows.get(name)
    );
  }

  /**
   * Check if a workflow name is a predefined workflow
   */
  public isPredefinedWorkflow(name: string): boolean {
    return this.predefinedWorkflows.has(name);
  }

  /**
   * Get workflow names as enum values for tool schema
   */
  public getWorkflowNames(): string[] {
    return Array.from(this.predefinedWorkflows.keys());
  }

  /**
   * Load a workflow (predefined or custom) for a project
   * FIXED: Now respects the workflow parameter correctly
   */
  public loadWorkflowForProject(
    projectPath: string,
    workflowName?: string
  ): YamlStateMachine {
    // If no workflow specified, default to waterfall
    if (!workflowName) {
      workflowName = DEFAULT_WORKFLOW_NAME;
    }

    // If workflow name is 'custom', try to load custom workflow
    if (workflowName === 'custom') {
      const customFilePaths = [
        path.join(projectPath, '.vibe', 'workflow.yaml'),
        path.join(projectPath, '.vibe', 'workflow.yml'),
      ];

      try {
        for (const filePath of customFilePaths) {
          if (fs.existsSync(filePath)) {
            logger.info('Loading custom workflow from project', { filePath });
            return this.stateMachineLoader.loadFromFile(filePath);
          }
        }
        // If custom workflow was requested but not found, throw error
        throw new Error(
          `Custom workflow not found. Expected .vibe/workflow.yaml or .vibe/workflow.yml in ${projectPath}`
        );
      } catch (error) {
        logger.error('Could not load custom state machine:', error as Error);
        throw error;
      }
    }

    // If it's a predefined workflow, return it
    if (this.isPredefinedWorkflow(workflowName)) {
      const workflow = this.getWorkflow(workflowName);
      if (workflow) {
        logger.info('Loading predefined workflow', { workflowName });
        return workflow;
      }
    }

    throw new Error(`Unknown workflow: ${workflowName}`);
  }

  /**
   * Find the workflows directory using multiple strategies
   * This handles both development and npm package deployment scenarios
   */
  private findWorkflowsDirectory(): string | null {
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    const strategies: string[] = [];

    // Strategy 1: Relative to current file (development and direct npm scenarios)
    // From dist/workflow-manager.js -> ../resources/workflows
    strategies.push(
      path.resolve(path.dirname(currentFilePath), '../resources/workflows')
    );

    // Strategy 2: Find package root by looking for package.json with our package name
    let currentDir = path.dirname(currentFilePath);
    for (let i = 0; i < 10; i++) {
      // Limit search depth
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8')
          );
          if (packageJson.name === 'responsible-vibe-mcp') {
            strategies.push(path.join(currentDir, 'resources/workflows'));
            break;
          }
        } catch (_error) {
          // Ignore JSON parse errors and continue searching
        }
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // Reached filesystem root
      currentDir = parentDir;
    }

    // Strategy 3: Common npm installation paths
    // Local node_modules (when used as dependency)
    strategies.push(
      path.join(
        process.cwd(),
        'node_modules/responsible-vibe-mcp/resources/workflows'
      )
    );

    // Global npm installation (when installed globally)
    if (process.env.NODE_PATH) {
      strategies.push(
        path.join(
          process.env.NODE_PATH,
          'responsible-vibe-mcp/resources/workflows'
        )
      );
    }

    // Strategy 4: npx cache locations (for npx responsible-vibe-mcp@latest)
    // npx typically caches packages in ~/.npm/_npx or similar locations
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      // Common npx cache locations
      const npxCachePaths = [
        path.join(homeDir, '.npm/_npx'),
        path.join(homeDir, '.npm/_cacache'),
        path.join(homeDir, 'AppData/Local/npm-cache/_npx'), // Windows
        path.join(homeDir, 'Library/Caches/npm/_npx'), // macOS
      ];

      for (const cachePath of npxCachePaths) {
        if (fs.existsSync(cachePath)) {
          try {
            // Look for responsible-vibe-mcp in cache subdirectories
            const cacheEntries = fs.readdirSync(cachePath);
            for (const entry of cacheEntries) {
              const entryPath = path.join(cachePath, entry);
              if (fs.statSync(entryPath).isDirectory()) {
                // Look for our package in this cache entry
                const possiblePaths = [
                  path.join(
                    entryPath,
                    'node_modules/responsible-vibe-mcp/resources/workflows'
                  ),
                  path.join(
                    entryPath,
                    'responsible-vibe-mcp/resources/workflows'
                  ),
                ];
                strategies.push(...possiblePaths);
              }
            }
          } catch (_error) {
            // Ignore errors reading cache directories
          }
        }
      }
    }

    // Strategy 5: Look in the directory where the current executable is located
    // This handles cases where npx runs the package from a temporary location
    const executableDir = path.dirname(process.argv[1] || '');
    if (executableDir) {
      strategies.push(path.join(executableDir, '../resources/workflows'));
      strategies.push(path.join(executableDir, 'resources/workflows'));
    }

    // Strategy 6: Use require.resolve to find the package location
    try {
      // Try to resolve the package.json of our own package
      const require = createRequire(import.meta.url);
      const packagePath = require.resolve('responsible-vibe-mcp/package.json');
      const packageDir = path.dirname(packagePath);
      strategies.push(path.join(packageDir, 'resources/workflows'));
    } catch (_error) {
      // require.resolve might fail in some environments, that's okay
    }

    // Remove duplicates and invalid paths
    const uniqueStrategies = [...new Set(strategies)].filter(
      p => p.trim() !== '/resources/workflows'
    );

    // Test each strategy
    for (const workflowsDir of uniqueStrategies) {
      logger.debug('Trying workflows directory', { workflowsDir });
      if (fs.existsSync(workflowsDir)) {
        // Verify it contains workflow files
        try {
          const files = fs.readdirSync(workflowsDir);
          const yamlFiles = files.filter(
            file => file.endsWith('.yaml') || file.endsWith('.yml')
          );
          if (yamlFiles.length > 0) {
            logger.info('Found workflows directory', {
              workflowsDir,
              yamlFiles: yamlFiles.length,
            });
            return workflowsDir;
          }
        } catch (error) {
          // Directory exists but can't read it, continue to next strategy
          logger.debug('Cannot read workflows directory', {
            workflowsDir,
            error,
          });
        }
      }
    }

    logger.error(
      'Could not find workflows directory',
      new Error('Workflows directory not found'),
      {
        strategiesCount: uniqueStrategies.length,
        currentFilePath,
        strategies: uniqueStrategies,
      }
    );
    return null;
  }

  /**
   * Load all predefined workflows from resources/workflows directory
   */
  private loadPredefinedWorkflows(): void {
    try {
      const workflowsDir = this.findWorkflowsDirectory();

      if (!workflowsDir || !fs.existsSync(workflowsDir)) {
        logger.warn('Workflows directory not found', { workflowsDir });
        return;
      }

      // Read all YAML files in the workflows directory
      const files = fs.readdirSync(workflowsDir);
      const yamlFiles = files.filter(
        file => file.endsWith('.yaml') || file.endsWith('.yml')
      );

      logger.info('Loading predefined workflows', {
        workflowsDir,
        yamlFiles: yamlFiles.length,
      });

      for (const file of yamlFiles) {
        try {
          const filePath = path.join(workflowsDir, file);
          const workflow = this.stateMachineLoader.loadFromFile(filePath);
          const workflowName = path.basename(file, path.extname(file));

          // Apply domain filtering
          if (this.enabledDomains.size > 0 && workflow.metadata?.domain) {
            if (!this.enabledDomains.has(workflow.metadata.domain)) {
              logger.debug('Skipping workflow due to domain filter', {
                name: workflowName,
                domain: workflow.metadata.domain,
                enabledDomains: Array.from(this.enabledDomains),
              });
              continue;
            }
          }

          this.predefinedWorkflows.set(workflowName, workflow);

          const workflowInfo: WorkflowInfo = {
            name: workflowName,
            displayName: workflow.name,
            description: workflow.description,
            initialState: workflow.initial_state,
            phases: Object.keys(workflow.states),
            metadata: workflow.metadata,
          };

          this.workflowInfos.set(workflowName, workflowInfo);

          logger.info('Loaded predefined workflow', {
            name: workflowName,
            domain: workflow.metadata?.domain,
            phases: workflowInfo.phases.length,
          });
        } catch (error) {
          logger.error('Failed to load workflow file', error as Error, {
            file,
          });
        }
      }

      logger.info('Predefined workflows loaded', {
        count: this.predefinedWorkflows.size,
        workflows: Array.from(this.predefinedWorkflows.keys()),
      });
    } catch (error) {
      logger.error('Failed to load predefined workflows', error as Error);
    }
  }

  /**
   * Validate a workflow name
   */
  public validateWorkflowName(
    workflowName: string,
    projectPath: string
  ): boolean {
    // Check if it's a predefined workflow
    if (this.isPredefinedWorkflow(workflowName)) {
      return true;
    }

    // Check if it's 'custom' and custom workflow exists
    if (workflowName === 'custom') {
      const customFilePaths = [
        path.join(projectPath, '.vibe', 'workflow.yaml'),
        path.join(projectPath, '.vibe', 'workflow.yml'),
      ];

      return customFilePaths.some(filePath => fs.existsSync(filePath));
    }

    return false;
  }
}
