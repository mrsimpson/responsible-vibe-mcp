#!/usr/bin/env node

/**
 * Vibe Feature MCP Server Entry Point
 *
 * Starts the MCP server with stdio transport for process-based usage.
 * The core server logic is in server.ts for better testability.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ResponsibleVibeMCPServer } from './server.js';

// Re-export for external use
export { ResponsibleVibeMCPServer };
import { createLogger } from '@responsible-vibe/core';

const logger = createLogger('Main');

/**
 * Parse command line arguments and handle special flags
 */
function parseCliArgs(): { shouldStartServer: boolean } {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Use responsible-vibe-cli for CLI functionality');
    return { shouldStartServer: false };
  }

  // Handle version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log('responsible-vibe-mcp (MCP server)');
    return { shouldStartServer: false };
  }

  // No special flags, start server normally
  return { shouldStartServer: true };
}

/**
 * Main entry point for the MCP server process
 */
async function main() {
  // Parse CLI arguments first
  const { shouldStartServer } = parseCliArgs();

  // If special flags were handled, exit gracefully
  if (!shouldStartServer) {
    return;
  }

  // Normal MCP server startup
  try {
    const projectPath = process.env.PROJECT_PATH;

    // Create server instance with project path configuration
    const server = new ResponsibleVibeMCPServer({
      projectPath: projectPath,
    });

    // Initialize server
    await server.initialize();

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.getMcpServer().connect(transport);

    // Note: No logging here to ensure compatibility with Amazon Q CLI
    // Amazon Q CLI expects no logging notifications before MCP initialization completes

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down Vibe Feature MCP Server...');
      await server.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down Vibe Feature MCP Server...');
      await server.cleanup();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
// More robust check that works with npx and direct execution
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('responsible-vibe-mcp') ||
  process.argv[1]?.endsWith('index.js');

if (isMainModule) {
  main().catch(error => {
    logger.error('Unhandled error in main', error);
    process.exit(1);
  });
}
