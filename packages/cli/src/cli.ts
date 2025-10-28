/**
 * CLI Functionality
 *
 * Handles command line arguments and delegates to appropriate functionality
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { WorkflowManager } from '@codemcp/workflows-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're in development (local) or published package
const isLocal = existsSync(join(__dirname, '../../core/dist/index.js'));

let generateSystemPrompt: (stateMachine: unknown) => string;
let StateMachineLoader: new () => unknown;

if (isLocal) {
  // Local development - use workspace imports
  // Node.js can resolve @codemcp/workflows-core via pnpm workspace configuration
  const coreModule = await import('@codemcp/workflows-core');
  generateSystemPrompt = coreModule.generateSystemPrompt as (
    stateMachine: unknown
  ) => string;
  StateMachineLoader = coreModule.StateMachineLoader as new () => unknown;
} else {
  // Published package - use relative imports
  // Node.js cannot resolve @codemcp/workflows-core from subdirectories in published packages
  // because it expects packages in node_modules/@codemcp/workflows-core/, not
  // node_modules/responsible-vibe-mcp/packages/core/
  const coreModule = await import('../../core/dist/index.js');
  generateSystemPrompt = coreModule.generateSystemPrompt as (
    stateMachine: unknown
  ) => string;
  StateMachineLoader = coreModule.StateMachineLoader as new () => unknown;
}

import { startVisualizationTool } from './visualization-launcher.js';
import { generateConfig } from './config-generator.js';

/**
 * Parse command line arguments and handle CLI commands
 */
function parseCliArgs(): { shouldExit: boolean } {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return { shouldExit: true };
  }

  // Handle system prompt flag
  if (args.includes('--system-prompt')) {
    showSystemPrompt();
    return { shouldExit: true };
  }

  // Handle workflow commands
  const workflowIndex = args.findIndex(arg => arg === 'workflow');
  if (workflowIndex !== -1) {
    const subcommand = args[workflowIndex + 1];
    if (subcommand === 'list') {
      handleWorkflowList();
      return { shouldExit: true };
    } else if (subcommand === 'copy') {
      const sourceWorkflow = args[workflowIndex + 2];
      const customName = args[workflowIndex + 3];
      if (!sourceWorkflow || !customName) {
        console.error(
          '❌ Error: workflow copy requires source workflow and custom name'
        );
        console.error('Usage: workflow copy <source-workflow> <custom-name>');
        process.exit(1);
      }
      handleWorkflowCopy(sourceWorkflow, customName);
      return { shouldExit: true };
    } else {
      console.error('❌ Unknown workflow subcommand:', subcommand);
      console.error('Available: workflow list, workflow copy <custom-name>');
      process.exit(1);
    }
  }

  // Handle generate config flag
  const generateConfigIndex = args.findIndex(
    arg => arg === '--generate-config'
  );
  if (generateConfigIndex !== -1) {
    const agent = args[generateConfigIndex + 1];
    if (!agent) {
      console.error('❌ Error: --generate-config requires an agent parameter');
      console.error('Usage: --generate-config <agent>');
      console.error('Supported agents: amazonq-cli, claude, gemini, opencode');
      process.exit(1);
    }
    handleGenerateConfig(agent);
    return { shouldExit: true };
  }

  // Handle validate workflow flag
  const validateIndex = args.findIndex(arg => arg === '--validate');
  if (validateIndex !== -1) {
    const workflowPath = args[validateIndex + 1];
    if (!workflowPath) {
      console.error('❌ Error: --validate requires a workflow file path');
      console.error('Usage: --validate <workflow-file.yaml>');
      process.exit(1);
    }
    handleValidateWorkflow(workflowPath);
    return { shouldExit: true };
  }

  // Handle visualization flag (default behavior)
  if (
    args.includes('--visualize') ||
    args.includes('--viz') ||
    args.length === 0
  ) {
    startVisualizationTool();
    return { shouldExit: true };
  }

  // Unknown arguments
  console.error('❌ Unknown arguments:', args.join(' '));
  showHelp();
  return { shouldExit: true };
}

/**
 * Handle workflow validation
 */
function handleValidateWorkflow(workflowPath: string): void {
  try {
    console.log(`🔍 Validating workflow: ${workflowPath}`);

    const loader = new StateMachineLoader() as {
      loadFromFile: (path: string) => unknown;
    };
    const workflow = loader.loadFromFile(workflowPath) as {
      name: string;
      description: string;
      initial_state: string;
      states: Record<string, unknown>;
      metadata?: { domain?: string; complexity?: string };
    };

    console.log('✅ Workflow validation successful!');
    console.log(`📋 Workflow: ${workflow.name}`);
    console.log(`📝 Description: ${workflow.description}`);
    console.log(`🏁 Initial state: ${workflow.initial_state}`);
    console.log(`🔄 States: ${Object.keys(workflow.states).join(', ')}`);

    if (workflow.metadata) {
      console.log(`🏷️  Domain: ${workflow.metadata.domain || 'not specified'}`);
      console.log(
        `⚡ Complexity: ${workflow.metadata.complexity || 'not specified'}`
      );
    }
  } catch (error) {
    console.error('❌ Workflow validation failed:');
    console.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Handle workflow list command
 */
function handleWorkflowList(): void {
  try {
    const workflowManager = new WorkflowManager();
    const workflows = workflowManager.getAvailableWorkflowsForProject(
      process.cwd()
    );

    console.log('📋 Available workflows:');
    for (const w of workflows) {
      console.log(`  ${w.name.padEnd(12)} - ${w.description}`);
    }
  } catch (error) {
    console.error('Error listing workflows:', error);
    process.exit(1);
  }
}

/**
 * Handle workflow copy command
 */
function handleWorkflowCopy(sourceWorkflow: string, customName: string): void {
  try {
    // Get all available workflows (including unloaded domains)
    const workflowManager = new WorkflowManager();
    const allWorkflows = workflowManager.getAllAvailableWorkflows();

    // Validate source workflow exists
    const validWorkflow = allWorkflows.find(w => w.name === sourceWorkflow);
    if (!validWorkflow) {
      console.error(`❌ Invalid source workflow: ${sourceWorkflow}`);
      console.error(
        `Available workflows: ${allWorkflows.map(w => w.name).join(', ')}`
      );
      process.exit(1);
    }

    // Find source workflow file
    const possibleSourcePaths = [
      join(
        __dirname,
        '..',
        '..',
        '..',
        'resources',
        'workflows',
        `${sourceWorkflow}.yaml`
      ),
      join(
        __dirname,
        '..',
        '..',
        'core',
        'resources',
        'workflows',
        `${sourceWorkflow}.yaml`
      ),
      join(process.cwd(), 'resources', 'workflows', `${sourceWorkflow}.yaml`),
    ];

    let sourceContent = null;
    for (const sourcePath of possibleSourcePaths) {
      if (existsSync(sourcePath)) {
        sourceContent = readFileSync(sourcePath, 'utf8');
        break;
      }
    }

    if (!sourceContent) {
      console.error(`❌ Could not find source workflow: ${sourceWorkflow}`);
      process.exit(1);
    }

    // Create .vibe/workflows directory if it doesn't exist
    const vibeDir = join(process.cwd(), '.vibe');
    const workflowsDir = join(vibeDir, 'workflows');

    if (!existsSync(vibeDir)) {
      mkdirSync(vibeDir, { recursive: true });
    }
    if (!existsSync(workflowsDir)) {
      mkdirSync(workflowsDir, { recursive: true });
    }

    // Update workflow name in content
    const customContent = sourceContent.replace(
      new RegExp(`name: '${sourceWorkflow}'`, 'g'),
      `name: '${customName}'`
    );

    const workflowPath = join(workflowsDir, `${customName}.yaml`);

    if (existsSync(workflowPath)) {
      console.error(
        `❌ Workflow '${customName}' already exists at ${workflowPath}`
      );
      process.exit(1);
    }

    writeFileSync(workflowPath, customContent);
    console.log(
      `✅ Copied '${sourceWorkflow}' workflow to '${customName}' at ${workflowPath}`
    );
    console.log('💡 Edit the file to customize your workflow');
  } catch (error) {
    console.error('Error copying workflow:', error);
    process.exit(1);
  }
}

/**
 * Handle generate config command
 */
async function handleGenerateConfig(agent: string): Promise<void> {
  try {
    await generateConfig(agent, process.cwd());
  } catch (error) {
    console.error(`❌ Failed to generate configuration: ${error}`);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
Responsible Vibe CLI Tools

USAGE:
  responsible-vibe-mcp [OPTIONS]
  responsible-vibe-mcp workflow <SUBCOMMAND>

OPTIONS:
  --help, -h                    Show this help message
  --system-prompt               Show the system prompt for LLM integration
  --visualize, --viz            Start the interactive workflow visualizer (default)
  --generate-config <agent>     Generate configuration files for AI coding agents
  --validate <workflow.yaml>    Validate a workflow file

WORKFLOW COMMANDS:
  workflow list                 List available workflows
  workflow copy <source> <name> Copy a workflow with custom name

SUPPORTED AGENTS:
  amazonq-cli                   Generate .amazonq/cli-agents/vibe.json
  claude                        Generate CLAUDE.md, .mcp.json, settings.json
  gemini                        Generate settings.json, GEMINI.md
  opencode                      Generate opencode.json

DESCRIPTION:
  CLI tools for the responsible-vibe development workflow system.
  By default, starts the interactive workflow visualizer.

MORE INFO:
  GitHub: https://github.com/mrsimpson/vibe-feature-mcp
  npm: https://www.npmjs.com/package/responsible-vibe-mcp
`);
}

/**
 * Show system prompt for LLM integration
 */
function showSystemPrompt(): void {
  try {
    // Load the default state machine for prompt generation
    const loader = new StateMachineLoader() as {
      loadStateMachine: (cwd: string) => unknown;
    };
    const stateMachine = loader.loadStateMachine(process.cwd());

    // Generate the system prompt
    const systemPrompt = generateSystemPrompt(stateMachine);

    console.log(systemPrompt);
  } catch (error) {
    console.error('Error generating system prompt:', error);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
export function runCli() {
  const { shouldExit } = parseCliArgs();

  if (shouldExit) {
    return;
  }
}
