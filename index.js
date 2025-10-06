#!/usr/bin/env node

/**
 * Root entry point that routes to appropriate functionality
 */

const args = process.argv.slice(2);

// Simple routing: no arguments = MCP server, any arguments = CLI
if (args.length === 0) {
  // No arguments, start MCP server
  import('./packages/mcp-server/dist/index.js');
} else {
  // Any arguments, route to CLI
  import('./packages/cli/dist/index.js');
}

// Re-export for external use
export * from './packages/mcp-server/dist/index.js';
