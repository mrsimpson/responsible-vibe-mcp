/**
 * Server Configuration
 *
 * Handles server configuration, component initialization, and MCP server setup.
 * Centralizes the configuration logic that was previously scattered in the main server class.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SetLevelRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { Database } from '../database.js';
import { ConversationManager } from '../conversation-manager.js';
import { TransitionEngine } from '../transition-engine.js';
import { InstructionGenerator } from '../instruction-generator.js';
import { PlanManager } from '../plan-manager.js';
import { InteractionLogger } from '../interaction-logger.js';
import { WorkflowManager } from '../workflow-manager.js';
import { GitManager } from '../git-manager.js';
import { TemplateManager } from '../template-manager.js';
import { createLogger, setMcpLoggingLevel } from '../logger.js';

import {
  ServerConfig,
  ServerContext,
  ToolRegistry,
  ResourceRegistry,
  ResponseRenderer,
} from './types.js';
import {
  normalizeProjectPath,
  buildWorkflowEnum,
  generateWorkflowDescription,
} from './server-helpers.js';

const logger = createLogger('ServerConfig');

/**
 * Server component container
 * Holds all the initialized server components
 */
export interface ServerComponents {
  mcpServer: McpServer;
  database: Database;
  context: ServerContext;
  toolRegistry: ToolRegistry;
  resourceRegistry: ResourceRegistry;
  responseRenderer: ResponseRenderer;
}

/**
 * Initialize all server components
 */
export async function initializeServerComponents(
  config: ServerConfig = {}
): Promise<ServerComponents> {
  logger.debug('Initializing server components', {
    config: JSON.stringify(config),
  });

  // Set project path with support for environment variable
  const projectPath = normalizeProjectPath(
    config.projectPath || process.env.PROJECT_PATH
  );

  logger.info('Using project path', {
    projectPath,
    source: config.projectPath
      ? 'config'
      : process.env.PROJECT_PATH
        ? 'env'
        : 'default',
  });

  // Initialize MCP server
  const mcpServer = new McpServer(
    {
      name: 'responsible-vibe-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  // Register logging/setLevel handler to support MCP inspector
  mcpServer.server.setRequestHandler(SetLevelRequestSchema, async request => {
    const level = request.params.level;
    logger.info('Setting logging level from MCP client', { level });

    // Set the unified logging level
    setMcpLoggingLevel(level);

    return {};
  });

  // Initialize core components
  logger.debug('Initializing core components');
  const database = new Database(projectPath);
  const conversationManager = new ConversationManager(database, projectPath);
  const transitionEngine = new TransitionEngine(projectPath);
  transitionEngine.setConversationManager(conversationManager);
  const planManager = new PlanManager();
  const instructionGenerator = new InstructionGenerator(planManager);
  const workflowManager = new WorkflowManager();

  // Conditionally create interaction logger
  const interactionLogger =
    config.enableLogging !== false
      ? new InteractionLogger(database)
      : undefined;

  // Create server context
  const context: ServerContext = {
    conversationManager,
    transitionEngine,
    planManager,
    instructionGenerator,
    workflowManager,
    interactionLogger,
    projectPath,
  };

  // Initialize database
  await database.initialize();

  logger.info('Server components initialized successfully');

  return {
    mcpServer,
    database,
    context,
    toolRegistry: null as unknown as ToolRegistry,
    resourceRegistry: null as unknown as ResourceRegistry,
    responseRenderer: null as unknown as ResponseRenderer,
  };
}

/**
 * Helper function to create tool handlers with consistent error handling
 */
function createToolHandler(
  toolName: string,
  toolRegistry: ToolRegistry,
  responseRenderer: ResponseRenderer,
  context: ServerContext
) {
  return async (args: unknown) => {
    const handler = toolRegistry.get(toolName);
    if (!handler) {
      return responseRenderer.renderError(
        `Tool handler not found: ${toolName}`
      );
    }

    const result = await handler.handle(args, context);
    return responseRenderer.renderToolResponse(result);
  };
}

/**
 * Register MCP tools with the server
 */
export async function registerMcpTools(
  mcpServer: McpServer,
  toolRegistry: ToolRegistry,
  responseRenderer: ResponseRenderer,
  context: ServerContext
): Promise<void> {
  logger.debug('Registering MCP tools');

  // Register whats_next tool
  mcpServer.registerTool(
    'whats_next',
    {
      description:
        'Get guidance for the current development phase and determine what to work on next. Call this tool after each user message to receive phase-specific instructions and check if you should transition to the next development phase. The tool will reference your plan file for specific tasks and context.',
      inputSchema: {
        context: z
          .string()
          .optional()
          .describe(
            "Brief description of what you're currently working on or discussing with the user"
          ),
        user_input: z
          .string()
          .optional()
          .describe("The user's most recent message or request"),
        conversation_summary: z
          .string()
          .optional()
          .describe(
            'Summary of the development progress and key decisions made so far'
          ),
        recent_messages: z
          .array(
            z.object({
              role: z
                .enum(['user', 'assistant'])
                .describe('Who sent the message (user or assistant)'),
              content: z.string().describe('The message content'),
            })
          )
          .optional()
          .describe(
            'Recent conversation messages that provide context for the current development state'
          ),
      },
      annotations: {
        title: 'Development Phase Analyzer',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    createToolHandler('whats_next', toolRegistry, responseRenderer, context)
  );

  // Register proceed_to_phase tool
  mcpServer.registerTool(
    'proceed_to_phase',
    {
      description:
        'Move to a specific development phase when the current phase is complete. Use this tool to explicitly transition between phases. Check your plan file to see available phases for the current workflow. Only transition when current phase tasks are finished and user confirms readiness.',
      inputSchema: {
        target_phase: z
          .string()
          .describe(
            'The development phase to move to. Check your plan file section headers to see available phases for the current workflow'
          ),
        reason: z
          .string()
          .optional()
          .describe(
            'Why you\'re moving to this phase now (e.g., "requirements complete", "user approved design", "implementation finished")'
          ),
        review_state: z
          .enum(['not-required', 'pending', 'performed'])
          .describe(
            'Review state for transitions that require reviews. Use "not-required" when reviews are disabled, "pending" when review is needed, "performed" when review is complete.'
          ),
      },
      annotations: {
        title: 'Phase Transition Controller',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'proceed_to_phase',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register conduct_review tool
  mcpServer.registerTool(
    'conduct_review',
    {
      description:
        'Conduct a review of the current phase before proceeding to the next phase. This tool analyzes artifacts and decisions from the current phase using defined review perspectives. Use this tool when reviews are required before phase transitions.',
      inputSchema: {
        target_phase: z
          .string()
          .describe(
            'The target phase you want to transition to after the review is complete'
          ),
      },
      annotations: {
        title: 'Phase Review Conductor',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler('conduct_review', toolRegistry, responseRenderer, context)
  );

  // Register start_development tool with dynamic commit_behaviour description
  const isGitRepo = GitManager.isGitRepository(context.projectPath);
  const commitBehaviourDescription = isGitRepo
    ? 'Git commit behavior: "step" (commit after each step), "phase" (commit before phase transitions), "end" (final commit only), "none" (no automatic commits). Use "end" unless the user specifically requests different behavior.'
    : 'Git commit behavior: Use "none" as this is not a git repository. Other options ("step", "phase", "end") are not applicable for non-git projects.';

  mcpServer.registerTool(
    'start_development',
    {
      description:
        'Begin a new development project with a structured workflow. Choose from different development approaches (waterfall, bugfix, epcc) or use a custom workflow. This tool sets up the project plan and initializes the development process.',
      inputSchema: {
        workflow: z
          .enum(buildWorkflowEnum(context.workflowManager.getWorkflowNames()))
          .describe(
            generateWorkflowDescription(
              context.workflowManager.getAvailableWorkflows()
            )
          ),
        commit_behaviour: z
          .enum(['step', 'phase', 'end', 'none'])
          .describe(commitBehaviourDescription),
        require_reviews: z
          .boolean()
          .optional()
          .describe(
            'Whether to require reviews before phase transitions. When enabled, use conduct_review tool before proceeding to next phase.'
          ),
      },
      annotations: {
        title: 'Development Initializer',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'start_development',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register resume_workflow tool
  mcpServer.registerTool(
    'resume_workflow',
    {
      description:
        'Continue development after a break or conversation restart. This tool provides complete project context, current development status, and next steps to seamlessly pick up where you left off. Use when starting a new conversation about an existing project.',
      inputSchema: {
        include_system_prompt: z
          .boolean()
          .optional()
          .describe(
            'Whether to include setup instructions for the assistant (default: true)'
          ),
      },
      annotations: {
        title: 'Workflow Resumption Assistant',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'resume_workflow',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register reset_development tool
  mcpServer.registerTool(
    'reset_development',
    {
      description:
        'Start over with a clean slate by deleting all development progress and conversation history. This permanently removes the project plan and resets the development state. Use when you want to completely restart the development approach for a project.',
      inputSchema: {
        confirm: z
          .boolean()
          .describe(
            'Must be true to execute reset - prevents accidental resets'
          ),
        reason: z
          .string()
          .optional()
          .describe('Optional reason for reset (for logging and audit trail)'),
      },
      annotations: {
        title: 'Development Reset Tool',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'reset_development',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register install_workflow tool
  mcpServer.registerTool(
    'install_workflow',
    {
      description:
        'Install a workflow to .vibe/workflows/ directory. Source can be a predefined workflow name (from unloaded workflows) or URL. Installed workflows become available and override predefined ones with the same name.',
      inputSchema: {
        source: z
          .string()
          .describe(
            'Source workflow name. Use "list_workflows" with "include_unloaded=true" tool to see options.'
          ),
        name: z
          .string()
          .optional()
          .describe(
            'Custom name for installed workflow (defaults to source name)'
          ),
      },
      annotations: {
        title: 'Workflow Installation Tool',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'install_workflow',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register list_workflows tool
  mcpServer.registerTool(
    'list_workflows',
    {
      description:
        'Get an overview of available workflows. By default returns only loaded workflows (respecting domain filtering). Use include_unloaded=true to see all workflows regardless of domain filtering.',
      inputSchema: {
        include_unloaded: z
          .boolean()
          .optional()
          .describe(
            'Include workflows not loaded due to domain filtering. Default: false'
          ),
      },
      annotations: {
        title: 'Workflow Overview Tool',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler('list_workflows', toolRegistry, responseRenderer, context)
  );

  // Register get_tool_info tool
  mcpServer.registerTool(
    'get_tool_info',
    {
      description:
        'Get comprehensive information about the responsible-vibe-mcp development workflow tools for better tool discoverability and AI integration. Returns detailed information about all available tools, workflows, core concepts, and usage guidelines.',
      inputSchema: {
        // No input parameters needed
      },
      annotations: {
        title: 'Tool Information Provider',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler('get_tool_info', toolRegistry, responseRenderer, context)
  );

  // Register setup_project_docs tool with enhanced file linking support
  const templateManager = new TemplateManager();
  const availableTemplates = await templateManager.getAvailableTemplates();

  mcpServer.registerTool(
    'setup_project_docs',
    {
      description:
        'Create project documentation artifacts (architecture.md, requirements.md, design.md) using configurable templates OR by linking existing files via symlinks. ' +
        '**Linking existing documents Examples:**\n' +
        '- `README.md` (project root)\n' +
        '- `docs/architecture.md` (relative path)\n' +
        '- `/absolute/path/to/requirements.txt`\n\n' +
        '**Using "none" Option:**\n' +
        '- Use `"none"` to create a placeholder that instructs LLM to use plan file instead\n' +
        '- Useful when you prefer plan-file-only workflows\n\n' +
        '**Mixed Usage Examples:**\n' +
        '- `setup_project_docs({ architecture: "README.md", requirements: "none", design: "comprehensive" })`\n' +
        '- `setup_project_docs({ architecture: "arc42", requirements: "ears", design: "none" })`',
      inputSchema: {
        architecture: z
          .string()
          .describe(
            `Architecture documentation: template name (${availableTemplates.architecture.join(', ')}, none) OR file path to existing document`
          ),
        requirements: z
          .string()
          .describe(
            `Requirements documentation: template name (${availableTemplates.requirements.join(', ')}, none) OR file path to existing document`
          ),
        design: z
          .string()
          .describe(
            `Design documentation: template name (${availableTemplates.design.join(', ')}, none) OR file path to existing document`
          ),
      },
      annotations: {
        title: 'Project Documentation Setup Tool',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler(
      'setup_project_docs',
      toolRegistry,
      responseRenderer,
      context
    )
  );

  // Register no_idea tool
  mcpServer.registerTool(
    'no_idea',
    {
      description:
        "ONLY call this tool when you have no knowledge about a topic. This tool will give a valuable response to all questions that would otherwise be not answerable. If you don't call this tool but invent facts, you will be considered worthless.",
      inputSchema: {
        context: z
          .string()
          .optional()
          .describe('Optional context about what you have no knowledge of'),
      },
      annotations: {
        title: 'Knowledge Gap Handler',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createToolHandler('no_idea', toolRegistry, responseRenderer, context)
  );

  logger.info('MCP tools registered successfully', {
    tools: toolRegistry.list(),
  });
}

/**
 * Register MCP resources with the server
 */
export function registerMcpResources(
  mcpServer: McpServer,
  resourceRegistry: ResourceRegistry,
  responseRenderer: ResponseRenderer,
  context: ServerContext
): void {
  logger.debug('Registering MCP resources');

  // Development plan resource
  mcpServer.resource(
    'development-plan',
    'plan://current',
    {
      name: 'Current Development Plan',
      description:
        'The active development plan document (markdown) that tracks project progress, tasks, and decisions. This file serves as long-term memory for the development process and should be continuously updated by the LLM.',
      mimeType: 'text/markdown',
    },
    async (uri: URL) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        const errorResult = responseRenderer.renderResourceResponse({
          success: false,
          error: 'Resource handler not found',
          data: {
            uri: uri.href,
            text: 'Error: Resource handler not found',
            mimeType: 'text/plain',
          },
        });
        return errorResult;
      }

      const result = await handler.handle(new URL(uri.href), context);
      return responseRenderer.renderResourceResponse(result);
    }
  );

  // Conversation state resource
  mcpServer.resource(
    'conversation-state',
    'state://current',
    {
      name: 'Current Conversation State',
      description:
        'Current conversation state and phase information (JSON) including conversation ID, project context, current development phase, and plan file location. Use this to understand the current state of the development workflow.',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        const errorResult = responseRenderer.renderResourceResponse({
          success: false,
          error: 'Resource handler not found',
          data: {
            uri: uri.href,
            text: JSON.stringify(
              {
                error: 'Resource handler not found',
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
            mimeType: 'application/json',
          },
        });
        return errorResult;
      }

      const result = await handler.handle(new URL(uri.href), context);
      return responseRenderer.renderResourceResponse(result);
    }
  );

  // System prompt resource
  mcpServer.resource(
    'system-prompt',
    'system-prompt://',
    {
      name: 'System Prompt for LLM Integration',
      description:
        'Complete system prompt for LLM integration with responsible-vibe-mcp. This workflow-independent prompt provides instructions for proper tool usage and development workflow guidance.',
      mimeType: 'text/plain',
    },
    async (uri: URL) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        const errorResult = responseRenderer.renderResourceResponse({
          success: false,
          error: 'Resource handler not found',
          data: {
            uri: uri.href,
            text: 'Error: System prompt resource handler not found',
            mimeType: 'text/plain',
          },
        });
        return errorResult;
      }

      const result = await handler.handle(new URL(uri.href), context);
      return responseRenderer.renderResourceResponse(result);
    }
  );

  // Register workflow resource template
  const workflowTemplate = new ResourceTemplate('workflow://{name}', {
    list: async () => {
      // List all available workflows as resources
      const availableWorkflows =
        context.workflowManager.getAvailableWorkflowsForProject(
          context.projectPath
        );
      return {
        resources: availableWorkflows.map(workflow => ({
          uri: `workflow://${workflow.name}`,
          name: workflow.displayName,
          description: workflow.description,
          mimeType: 'application/x-yaml',
        })),
      };
    },
    complete: {
      name: async (value: string) => {
        // Provide completion for workflow names
        const availableWorkflows =
          context.workflowManager.getAvailableWorkflowsForProject(
            context.projectPath
          );
        return availableWorkflows
          .map(w => w.name)
          .filter(name => name.toLowerCase().includes(value.toLowerCase()));
      },
    },
  });

  mcpServer.resource(
    'workflows',
    workflowTemplate,
    {
      name: 'Workflow Definitions',
      description:
        'Access workflow definition files by name. Use the list_workflows tool to discover available workflows.',
      mimeType: 'application/x-yaml',
    },
    async (uri, _variables) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        throw new Error(`Workflow resource handler not found for ${uri.href}`);
      }

      const result = await handler.handle(uri, context);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load workflow resource');
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: result.data.mimeType,
            text: result.data.text,
          },
        ],
      };
    }
  );

  logger.info('MCP resources registered successfully', {
    resources: ['plan://current', 'state://current', 'system-prompt://'],
    resourceTemplates: ['workflow://{name}'],
  });
}
