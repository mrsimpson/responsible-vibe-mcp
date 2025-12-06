/**
 * Configuration Generator for Different AI Coding Agents
 *
 * This module implements a factory pattern to generate configuration files
 * for different AI coding agents (Amazon Q, Claude Code, Gemini CLI).
 * Each agent has its own generator class with single responsibility.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { generateSystemPrompt } from '@codemcp/workflows-core';
import { StateMachineLoader } from '@codemcp/workflows-core';
import {} from '@codemcp/workflows-core';

/**
 * Deep merge two objects, with values from source taking precedence
 * Arrays are replaced, not merged
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  if (!source || typeof source !== 'object') {
    return source;
  }

  if (!target || typeof target !== 'object') {
    return source;
  }

  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      // For primitives, arrays, or null values, use source value
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Abstract base class for configuration generators
 */
abstract class ConfigGenerator {
  /**
   * Generate configuration files for the specific agent
   */
  abstract generate(outputDir: string): Promise<void>;

  /**
   * Get the system prompt using existing generation logic
   * Suppresses info logs during CLI operations
   */
  protected getSystemPrompt(): string {
    try {
      // Create loggers with ERROR level to suppress info messages
      const loader = new StateMachineLoader();
      const stateMachine = loader.loadStateMachine(process.cwd());
      return generateSystemPrompt(stateMachine);
    } catch (error) {
      throw new Error(`Failed to generate system prompt: ${error}`);
    }
  }

  /**
   * Write file with proper error handling
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await writeFile(filePath, content, 'utf-8');
      console.log(`✓ Generated: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Read and merge with existing JSON config file if it exists
   * Returns merged config with new config taking precedence
   */
  protected async mergeWithExistingConfig(
    filePath: string,
    newConfig: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!existsSync(filePath)) {
      return newConfig;
    }

    try {
      const existingContent = await readFile(filePath, 'utf-8');
      const existingConfig = JSON.parse(existingContent) as Record<
        string,
        unknown
      >;
      console.log('✓ Merged with existing configuration');
      return deepMerge(existingConfig, newConfig);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Existing ${filePath} contains invalid JSON. Please fix the file or remove it to generate a new configuration. Error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * We'll be using the reduced deployable which only contains the mcp server, not the CLI
   * On Windows, npx commands need to be prefixed with "cmd /c"
   */
  protected getDefaultMcpConfig(): object {
    const isWindows = process.platform.startsWith('win');

    if (isWindows) {
      return {
        'responsible-vibe-mcp': {
          command: 'cmd',
          args: ['/c', 'npx', '@codemcp/workflows@latest'],
        },
      };
    }

    return {
      'responsible-vibe-mcp': {
        command: 'npx',
        args: ['@codemcp/workflows@latest'],
      },
    };
  }

  /**
   * Get default allowed tools for responsible-vibe-mcp
   */
  protected getDefaultAllowedTools(): string[] {
    return ['whats_next', 'conduct_review', 'list_workflows', 'get_tool_info'];
  }
}

/**
 * Amazon Q Configuration Generator
 * Generates a single comprehensive JSON file
 * Merges with existing configuration instead of overwriting
 */
class AmazonQConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();

    const newConfig: Record<string, unknown> = {
      name: 'vibe',
      description: 'Responsible vibe development',
      prompt: systemPrompt,
      mcpServers: mcpServers,
      tools: [
        'execute_bash',
        'fs_read',
        'fs_write',
        'report_issue',
        'knowledge',
        'thinking',
        'use_aws',
        '@responsible-vibe-mcp',
      ],
      allowedTools: [
        'fs_read',
        'fs_write',
        '@responsible-vibe-mcp/whats_next',
        '@responsible-vibe-mcp/conduct_review',
        '@responsible-vibe-mcp/list_workflows',
        '@responsible-vibe-mcp/get_tool_info',
      ],
      toolsSettings: {
        execute_bash: {
          alwaysAllow: [
            {
              preset: 'readOnly',
            },
          ],
        },
        use_aws: {
          alwaysAllow: [
            {
              preset: 'readOnly',
            },
          ],
        },
      },
      resources: ['file://README.md', 'file://.amazonq/rules/**/*.md'],
      hooks: {},
    };

    // Create .amazonq/cli-agents directory
    const amazonqDir = join(outputDir, '.amazonq', 'cli-agents');
    await mkdir(amazonqDir, { recursive: true });

    const configPath = join(amazonqDir, 'vibe.json');
    const finalConfig = await this.mergeWithExistingConfig(
      configPath,
      newConfig
    );
    await this.writeFile(configPath, JSON.stringify(finalConfig, null, 2));
  }
}

/**
 * Claude Code Configuration Generator
 * Generates multiple files: CLAUDE.md, .mcp.json, settings.json
 * Merges with existing configuration instead of overwriting
 */
class ClaudeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();

    // Generate CLAUDE.md (system prompt) - always overwrite as it's generated content
    const claudeMdPath = join(outputDir, 'CLAUDE.md');
    await this.writeFile(claudeMdPath, systemPrompt);

    // Generate .mcp.json (MCP server configuration) - merge with existing
    const mcpConfig: Record<string, unknown> = {
      mcpServers: mcpServers,
    };
    const mcpJsonPath = join(outputDir, '.mcp.json');
    const finalMcpConfig = await this.mergeWithExistingConfig(
      mcpJsonPath,
      mcpConfig
    );
    await this.writeFile(mcpJsonPath, JSON.stringify(finalMcpConfig, null, 2));

    // Generate settings.json (permissions and security) - merge with existing
    const settings: Record<string, unknown> = {
      permissions: {
        allow: [
          'MCP(responsible-vibe-mcp:whats_next)',
          'MCP(responsible-vibe-mcp:conduct_review)',
          'MCP(responsible-vibe-mcp:list_workflows)',
          'MCP(responsible-vibe-mcp:get_tool_info)',
          'Read(README.md)',
          'Read(./.vibe/**)',
          'Write(./.vibe/**)',
        ],
        ask: ['Bash(*)', 'Write(**)'],
        deny: ['Read(./.env)', 'Read(./.env.*)', 'Read(./secrets/**)'],
      },
    };
    const settingsPath = join(outputDir, 'settings.json');
    const finalSettings = await this.mergeWithExistingConfig(
      settingsPath,
      settings
    );
    await this.writeFile(settingsPath, JSON.stringify(finalSettings, null, 2));
  }
}

/**
 * Gemini CLI Configuration Generator
 * Generates settings.json and GEMINI.md
 * Merges with existing configuration instead of overwriting
 */
class GeminiConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();
    const allowedTools = this.getDefaultAllowedTools();

    // Generate settings.json (comprehensive configuration) - merge with existing
    const settings: Record<string, unknown> = {
      contextFileName: 'GEMINI.md',
      autoAccept: false,
      theme: 'Default',
      vimMode: false,
      sandbox: false,
      mcpServers: mcpServers,
      allowMCPServers: ['responsible-vibe-mcp'],
      coreTools: ['ReadFileTool', 'WriteFileTool', 'GlobTool', 'ShellTool'],
      telemetry: {
        enabled: false,
        target: 'local',
        otlpEndpoint: 'http://localhost:4317',
        logPrompts: false,
      },
      usageStatisticsEnabled: false,
      hideTips: false,
      hideBanner: false,
    };
    const settingsPath = join(outputDir, 'settings.json');
    const finalSettings = await this.mergeWithExistingConfig(
      settingsPath,
      settings
    );
    await this.writeFile(settingsPath, JSON.stringify(finalSettings, null, 2));

    // Generate GEMINI.md (context/prompt file) - always overwrite as it's generated content
    const geminiMdContent = `# Vibe Development Agent

${systemPrompt}

## Project Context

This agent is configured to work with the responsible-vibe-mcp server for structured development workflows.

## Available Tools

The following tools are available for development tasks:
${allowedTools.map(tool => `- ${tool}`).join('\n')}
`;
    const geminiMdPath = join(outputDir, 'GEMINI.md');
    await this.writeFile(geminiMdPath, geminiMdContent);
  }
}

/**
 * OpenCode Configuration Generator
 * Generates opencode.json with agent configuration and MCP server setup
 * Merges with existing configuration instead of overwriting
 */
class OpencodeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const configPath = join(outputDir, 'opencode.json');

    // Generate new config structure
    const newConfig: Record<string, unknown> = {
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        'responsible-vibe-mcp': {
          command: ['npx', 'responsible-vibe-mcp'],
          type: 'local',
          enabled: true,
        },
      },
      agent: {
        vibe: {
          description:
            'Responsible vibe development agent with structured workflows',
          mode: 'primary',
          prompt: systemPrompt,
          tools: {
            'responsible-vibe-mcp*': true,
          },
          permission: {
            'responsible-vibe-mcp_reset_development': 'ask',
            'responsible-vibe-mcp_start_development': 'ask',
            'responsible-vibe-mcp_proceed_to_phase': 'ask',
          },
        },
      },
    };

    const finalConfig = await this.mergeWithExistingConfig(
      configPath,
      newConfig
    );
    await this.writeFile(configPath, JSON.stringify(finalConfig, null, 2));
  }
}

/**
 * VS Code Configuration Generator
 * Generates .vscode/mcp.json and .github/agents/Vibe.agent.md for GitHub Copilot Vibe mode
 */
class VSCodeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();

    // Generate .vscode/mcp.json (MCP server configuration for VS Code)
    const vscodeDir = join(outputDir, '.vscode');
    await mkdir(vscodeDir, { recursive: true });

    const mcpConfig = {
      servers: mcpServers,
    };
    const mcpJsonPath = join(vscodeDir, 'mcp.json');
    await this.writeFile(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));

    // Generate .github/agents/Vibe.agent.md (Agent configuration for GitHub Copilot Vibe mode)
    const githubAgentsDir = join(outputDir, '.github', 'agents');
    await mkdir(githubAgentsDir, { recursive: true });

    const agentContent = `---
description: AI assistant that helps users develop software features using the responsible-vibe-mcp server.
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'responsible-vibe-mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'runSubagent']
---

${systemPrompt}
`;

    const agentPath = join(githubAgentsDir, 'Vibe.agent.md');
    await this.writeFile(agentPath, agentContent);
  }
}

/**
 * Factory class for creating configuration generators
 */
class ConfigGeneratorFactory {
  static createGenerator(agent: string): ConfigGenerator {
    switch (agent.toLowerCase()) {
      case 'amazonq-cli':
        return new AmazonQConfigGenerator();
      case 'claude':
        return new ClaudeConfigGenerator();
      case 'gemini':
        return new GeminiConfigGenerator();
      case 'opencode':
        return new OpencodeConfigGenerator();
      case 'vscode':
      case 'copilot-vscode':
        return new VSCodeConfigGenerator();
      default:
        throw new Error(
          `Unsupported agent: ${agent}. Supported agents: amazonq-cli, claude, gemini, opencode, vscode`
        );
    }
  }
}

/**
 * Main function to generate configuration for specified agent
 */
export async function generateConfig(
  agent: string,
  outputDir: string = '.'
): Promise<void> {
  console.log(`Generating configuration for ${agent}...`);

  const generator = ConfigGeneratorFactory.createGenerator(agent);
  await generator.generate(outputDir);

  console.log(`✅ Configuration generated successfully for ${agent}`);
}

/**
 * Export deepMerge for testing
 */
export { deepMerge };
