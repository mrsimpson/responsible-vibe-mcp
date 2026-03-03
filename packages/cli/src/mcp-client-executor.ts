/**
 * Generic MCP Client Executor
 *
 * Connects to any stdio MCP server via the MCP protocol, introspects its
 * available tools, and executes them by name. Works with any Node.js (or
 * other) MCP server – not just responsible-vibe-mcp.
 *
 * Usage:
 *   const exec = await McpClientExecutor.connect({ command: 'npx', args: ['my-mcp-server'] });
 *   const tools = await exec.listTools();
 *   const result = await exec.callTool('my_tool', { param: 'value' });
 *   await exec.disconnect();
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  type StdioServerParameters,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Parameters for spawning an MCP server process.
 * Mirrors StdioServerParameters from the MCP SDK.
 */
export type McpServerParams = StdioServerParameters;

/**
 * A single content item returned by a tool call.
 */
export interface ToolResultContent {
  type: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * Result of a tool call, as returned by the MCP protocol.
 */
export interface ToolCallResult {
  content: ToolResultContent[];
  isError?: boolean;
}

/**
 * Generic executor that connects to any stdio MCP server via the MCP
 * protocol and exposes its tools for direct CLI invocation.
 */
export class McpClientExecutor {
  private client: Client;

  private constructor(client: Client) {
    this.client = client;
  }

  /**
   * Spawn an MCP server and connect to it using the MCP protocol.
   *
   * @param params - Server spawn parameters (command, args, env, cwd, stderr)
   */
  static async connect(params: McpServerParams): Promise<McpClientExecutor> {
    const transport = new StdioClientTransport({
      ...params,
      // Suppress server-side log noise on the CLI's stderr by default
      stderr: params.stderr ?? 'pipe',
    });

    const client = new Client(
      { name: 'mcp-cli-executor', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    return new McpClientExecutor(client);
  }

  /**
   * Return all tools exposed by the connected MCP server.
   */
  async listTools(): Promise<Tool[]> {
    const result = await this.client.listTools();
    return result.tools;
  }

  /**
   * Execute a named tool on the connected MCP server.
   *
   * @param toolName - Name of the tool as returned by listTools()
   * @param args     - Tool arguments (must match the tool's inputSchema)
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> {
    const result = await this.client.callTool({
      name: toolName,
      arguments: args,
    });
    return result as ToolCallResult;
  }

  /**
   * Disconnect from the server and clean up the child process.
   */
  async disconnect(): Promise<void> {
    await this.client.close();
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing utilities (shared with the execute command)
// ---------------------------------------------------------------------------

/**
 * Parse CLI-style flags into a plain object.
 *
 * Supported forms:
 *   --key value         → { key: "value" }
 *   --key=value         → { key: "value" }
 *   --flag              → { flag: true }
 *   --json '{"k":"v"}' → all entries merged into result
 *
 * Values that look like JSON (numbers, booleans, objects, arrays) are
 * coerced automatically so callers receive the correct JS type.
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

    // Already handled above
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

/** Try to parse a string as JSON; fall back to the raw string. */
function coerceValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}
