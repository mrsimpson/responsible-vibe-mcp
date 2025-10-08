/**
 * CLI Functionality
 *
 * Handles command line arguments and delegates to appropriate functionality
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

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

OPTIONS:
  --help, -h                    Show this help message
  --system-prompt               Show the system prompt for LLM integration
  --visualize, --viz            Start the interactive workflow visualizer (default)
  --generate-config <agent>     Generate configuration files for AI coding agents

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
