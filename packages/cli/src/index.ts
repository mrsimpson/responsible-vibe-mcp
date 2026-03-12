#!/usr/bin/env node

/**
 * Main Entry Point
 *
 * Routes to MCP server (no args) or CLI (with args)
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
  // No arguments, start MCP server
  const isLocal = existsSync(join(__dirname, '../../mcp-server/dist/index.js'));
  if (isLocal) {
    const { startMcpServer } = await import('../../mcp-server/dist/index.js');
    await startMcpServer();
  } else {
    // Use string literal to avoid TypeScript resolution issues
    const mcpServerModule = '@codemcp/workflows-server';
    const { startMcpServer } = await import(mcpServerModule);
    await startMcpServer();
  }
} else {
  // Any arguments, run CLI
  const { runCli } = await import('./cli.js');
  await runCli();
}
