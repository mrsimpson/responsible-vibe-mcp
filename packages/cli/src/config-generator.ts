/**
 * Configuration Generator for Different AI Coding Agents
 *
 * This module implements a factory pattern to generate configuration files
 * for different AI coding agents (Amazon Q, Claude Code, Gemini CLI).
 * Each agent has its own generator class with single responsibility.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { generateSystemPrompt } from '@codemcp/workflows-core';
import { StateMachineLoader } from '@codemcp/workflows-core';
import {} from '@codemcp/workflows-core';

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
 */
class AmazonQConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();

    const config = {
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
    await this.writeFile(configPath, JSON.stringify(config, null, 2));
  }
}

/**
 * Claude Code Configuration Generator
 * Generates multiple files: CLAUDE.md, .mcp.json, settings.json
 */
class ClaudeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();

    // Generate CLAUDE.md (system prompt)
    const claudeMdPath = join(outputDir, 'CLAUDE.md');
    await this.writeFile(claudeMdPath, systemPrompt);

    // Generate .mcp.json (MCP server configuration)
    const mcpConfig = {
      mcpServers: mcpServers,
    };
    const mcpJsonPath = join(outputDir, '.mcp.json');
    await this.writeFile(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));

    // Generate settings.json (permissions and security)
    const settings = {
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
    await this.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  }
}

/**
 * Gemini CLI Configuration Generator
 * Generates settings.json and GEMINI.md
 */
class GeminiConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const mcpServers = this.getDefaultMcpConfig();
    const allowedTools = this.getDefaultAllowedTools();

    // Generate settings.json (comprehensive configuration)
    const settings = {
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
    await this.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    // Generate GEMINI.md (context/prompt file)
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
 */
class OpencodeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    const systemPrompt = this.getSystemPrompt();

    // Generate opencode.json configuration with correct MCP format
    const config = {
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

    const configPath = join(outputDir, 'opencode.json');
    await this.writeFile(configPath, JSON.stringify(config, null, 2));
  }
}

/**
 * VS Code Configuration Generator
 * Generates .vscode/mcp.json and .github/copilot-instructions.md for GitHub Copilot
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

    // Generate .github/copilot-instructions.md (System instructions for GitHub Copilot)
    const githubDir = join(outputDir, '.github');
    await mkdir(githubDir, { recursive: true });

    const copilotInstructions = `# Responsible Vibe Development Workflow

${systemPrompt}

## Available MCP Tools

The following tools are available via the responsible-vibe-mcp server. Reference them using the \`#\` syntax:

- \`#responsible-vibe-mcp_whats_next\` - Get guidance for current development phase and next steps
- \`#responsible-vibe-mcp_start_development\` - Initialize new development project with structured workflow
- \`#responsible-vibe-mcp_proceed_to_phase\` - Transition to next development phase
- \`#responsible-vibe-mcp_conduct_review\` - Review current phase before proceeding
- \`#responsible-vibe-mcp_list_workflows\` - List available development workflows
- \`#responsible-vibe-mcp_get_tool_info\` - Get comprehensive information about available tools
- \`#responsible-vibe-mcp_resume_workflow\` - Continue development after a break
- \`#responsible-vibe-mcp_reset_development\` - Start over with clean slate
- \`#responsible-vibe-mcp_setup_project_docs\` - Create project documentation artifacts

## Workflow Guidelines

1. **Always start** by calling \`#responsible-vibe-mcp_whats_next\` to understand current state
2. **Follow the plan** documented in \`.vibe/development-plan-*.md\`
3. **Ask before transitions** - use \`#responsible-vibe-mcp_proceed_to_phase\` only after user confirmation
4. **Document progress** in the plan file with [x] for completed tasks
5. **Review regularly** using \`#responsible-vibe-mcp_conduct_review\` before phase transitions

## Tool Usage Patterns

- Starting new work → \`#responsible-vibe-mcp_start_development\`
- Unsure what to do next → \`#responsible-vibe-mcp_whats_next\`
- Phase complete → \`#responsible-vibe-mcp_conduct_review\` then \`#responsible-vibe-mcp_proceed_to_phase\`
- See available workflows → \`#responsible-vibe-mcp_list_workflows\`
- After a break → \`#responsible-vibe-mcp_resume_workflow\`

## Project Context

This agent is configured to work with the responsible-vibe-mcp server for structured development workflows.
The MCP server provides state management and phase-based guidance for various development tasks.
`;

    const instructionsPath = join(githubDir, 'copilot-instructions.md');
    await this.writeFile(instructionsPath, copilotInstructions);
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
        return new VSCodeConfigGenerator();
      default:
        throw new Error(
          `Unsupported agent: ${agent}. Supported agents: amazonq-cli, claude, gemini, opencode, copilot-vscode`
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
