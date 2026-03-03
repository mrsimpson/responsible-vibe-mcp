/**
 * Generic Tool Executor
 *
 * Provides a programmatic interface to execute any MCP tool from the CLI
 * without starting the MCP transport. Creates only the server context and
 * tool registry needed to run tools directly.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Result of executing a tool
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

type VibeServer = {
  initialize(): Promise<void>;
  executeTool(toolName: string, args: unknown): Promise<ToolExecutionResult>;
  listAvailableTools(): string[];
  cleanup(): Promise<void>;
};

type ServerFactory = (config?: { projectPath?: string }) => Promise<VibeServer>;

/**
 * Resolve the server factory at call time (not at module load time) so that
 * test environments that mock modules never inadvertently load the full
 * mcp-server dependency graph.
 */
async function loadServerFactory(): Promise<ServerFactory> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const isLocal = existsSync(join(__dirname, '../../mcp-server/dist/index.js'));

  if (isLocal) {
    const mod = (await import('../../mcp-server/dist/index.js')) as {
      createResponsibleVibeMCPServer: ServerFactory;
    };
    return mod.createResponsibleVibeMCPServer;
  }

  const mod = (await import('@codemcp/workflows')) as {
    createResponsibleVibeMCPServer: ServerFactory;
  };
  return mod.createResponsibleVibeMCPServer;
}

/**
 * Generic executor that wraps the MCP server to run tools via CLI
 */
export class ToolExecutor {
  private server: VibeServer;

  private constructor(server: VibeServer) {
    this.server = server;
  }

  /**
   * Create and initialize a ToolExecutor for the given project path
   */
  static async create(projectPath?: string): Promise<ToolExecutor> {
    const createServer = await loadServerFactory();
    const config = projectPath !== undefined ? { projectPath } : {};
    const server = await createServer(config);
    await server.initialize();
    return new ToolExecutor(server);
  }

  /**
   * Execute a tool by name with the provided arguments
   */
  async execute(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    return this.server.executeTool(toolName, args);
  }

  /**
   * List all registered tool names
   */
  listTools(): string[] {
    return this.server.listAvailableTools();
  }

  /**
   * Release server resources
   */
  async cleanup(): Promise<void> {
    await this.server.cleanup();
  }
}

/**
 * Parse CLI-style flags into a plain object.
 *
 * Supported forms:
 *   --key value       → { key: "value" }
 *   --key=value       → { key: "value" }
 *   --flag            → { flag: true }
 *   --json '{"k":"v"}' → merged into result
 *
 * Values that look like JSON (numbers, booleans, objects, arrays) are
 * parsed automatically so callers receive the correct JS type.
 */
export function parseToolArgs(argv: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Handle --json <string> first – merges a full JSON object
  const jsonIdx = argv.indexOf('--json');
  if (jsonIdx !== -1) {
    const jsonStr = argv[jsonIdx + 1];
    if (!jsonStr) {
      throw new Error('--json requires a JSON string argument');
    }
    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error('--json value must be a JSON object');
      }
      Object.assign(result, parsed as Record<string, unknown>);
    } catch (e) {
      throw new Error(`Invalid JSON for --json: ${(e as Error).message}`);
    }
  }

  // Parse remaining --key [value] flags
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg || !arg.startsWith('--')) continue;

    // Skip --json and its value – already handled above
    if (arg === '--json') {
      i++;
      continue;
    }

    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      // --key=value
      const key = arg.slice(2, eqIdx);
      const rawValue = arg.slice(eqIdx + 1);
      result[key] = coerceValue(rawValue);
    } else {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        // --key value
        result[key] = coerceValue(next);
        i++;
      } else {
        // --flag  (boolean shorthand)
        result[key] = true;
      }
    }
  }

  return result;
}

/**
 * Try to parse a string as JSON; fall back to returning it as-is.
 */
function coerceValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}
