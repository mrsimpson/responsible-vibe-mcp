#!/usr/bin/env node

/**
 * Root entry point that routes to appropriate functionality
 */

// Check if CLI arguments are provided (excluding node and script name)
const args = process.argv.slice(2);

// Define CLI-specific flags that should route to CLI package
const cliFlags = [
  '--help',
  '-h',
  '--system-prompt',
  '--visualize',
  '--viz',
  '--generate-config',
];

// Check if any CLI-specific flags are present OR if --generate-config is used
const hasCliFlags =
  args.some(arg => cliFlags.includes(arg)) ||
  args.some(arg => arg.startsWith('--generate-config'));

// Route to appropriate package
if (hasCliFlags || args.length > 0) {
  // Route to CLI package for any arguments
  import('./packages/cli/dist/index.js');
} else {
  // No arguments, start MCP server
  import('./packages/mcp-server/dist/index.js');
}

// Re-export for external use
export * from './packages/mcp-server/dist/index.js';
