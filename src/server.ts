/**
 * Vibe Feature MCP Server Core
 * 
 * Separates the MCP server logic from transport layer to enable
 * both process-based and in-process testing.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { Database } from './database.js';
import { ConversationManager } from './conversation-manager.js';
import { TransitionEngine } from './transition-engine.js';
import { InstructionGenerator } from './instruction-generator.js';
import { PlanManager } from './plan-manager.js';
import { InteractionLogger } from './interaction-logger.js';
import { WorkflowManager } from './workflow-manager.js';
import { generateSystemPrompt } from './system-prompt-generator.js';
import { createLogger, setMcpServerForLogging } from './logger.js';

const logger = createLogger('Server');

/**
 * Server configuration options
 */
export interface ServerConfig {
  /** Project path to operate on (defaults to process.cwd()) */
  projectPath?: string;
  /** Database path override */
  databasePath?: string;
  /** Enable interaction logging */
  enableLogging?: boolean;
}

/**
 * Main server class that orchestrates all components
 * Can be used both as a standalone process and in-process for testing
 */
export class VibeFeatureMCPServer {
  private server: McpServer;
  private database: Database;
  private conversationManager: ConversationManager;
  private transitionEngine: TransitionEngine;
  private instructionGenerator: InstructionGenerator;
  private planManager: PlanManager;
  private workflowManager: WorkflowManager;
  private interactionLogger?: InteractionLogger;
  private projectPath: string;

  constructor(config: ServerConfig = {}) {
    logger.debug('Initializing VibeFeatureMCPServer', config);
    
    // Set project path
    this.projectPath = config.projectPath || process.cwd();
    
    // Initialize MCP server
    this.server = new McpServer({
      name: 'responsible-vibe-mcp',
      version: '1.0.0'
    });

    // Initialize components
    logger.debug('Initializing server components');
    this.database = new Database(this.projectPath);
    this.conversationManager = new ConversationManager(this.database, this.projectPath);
    this.transitionEngine = new TransitionEngine(this.projectPath);
    this.transitionEngine.setConversationManager(this.conversationManager);
    this.planManager = new PlanManager();
    this.instructionGenerator = new InstructionGenerator(this.planManager);
    this.workflowManager = new WorkflowManager();
    
    // Conditionally create interaction logger
    if (config.enableLogging !== false) {
      this.interactionLogger = new InteractionLogger(this.database);
    }

    // Setup server handlers
    this.setupHandlers();
    
    logger.info('VibeFeatureMCPServer initialized successfully');
  }

  /**
   * Ensure state machine is loaded for the given project path
   */
  private ensureStateMachineForProject(projectPath: string, workflowName?: string): void {
    const stateMachine = this.transitionEngine.getStateMachine(projectPath, workflowName);
    this.planManager.setStateMachine(stateMachine);
    this.instructionGenerator.setStateMachine(stateMachine);
  }

  /**
   * Get the underlying MCP server instance
   * This allows for both transport-based and direct testing
   */
  public getMcpServer(): McpServer {
    return this.server;
  }

  /**
   * Get project path
   */
  public getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * Get conversation manager (for testing)
   */
  public getConversationManager(): ConversationManager {
    return this.conversationManager;
  }

  /**
   * Get plan manager (for testing)
   */
  public getPlanManager(): PlanManager {
    return this.planManager;
  }

  /**
   * Setup all MCP server handlers
   */
  private setupHandlers(): void {
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  /**
   * Setup tool handlers
   */
  private setupToolHandlers(): void {
    // whats_next tool
    this.server.registerTool(
      'whats_next',
      {
        description: 'Analyze conversation context and determine the next development phase with specific instructions for the LLM. This is the primary tool for orchestrating development workflow and should be called after each user interaction.',
        inputSchema: {
          context: z.string().optional().describe('Additional context about current conversation or situation'),
          user_input: z.string().optional().describe('Latest user input or request for analysis'),
          conversation_summary: z.string().optional().describe('LLM-provided summary of the conversation so far, including key decisions and progress made'),
          recent_messages: z.array(z.object({
            role: z.enum(['user', 'assistant']).describe('The role of the message sender'),
            content: z.string().describe('The content of the message')
          })).optional().describe('Array of recent conversation messages that LLM considers relevant for context')
        },
        annotations: {
          title: 'Development Phase Analyzer',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false
        }
      },
      async (args) => {
        try {
          const result = await this.handleWhatsNext(args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('whats_next tool execution failed', error as Error);
          return {
            content: [{
              type: 'text' as const,
              text: `Error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // proceed_to_phase tool
    this.server.registerTool(
      'proceed_to_phase',
      {
        description: 'Explicitly transition to a specific development phase when the current phase is complete or when a direct phase change is needed. Use this tool when whats_next suggests a phase transition or when you need to move to a specific phase. Always get confirmation by the user for the reason',
        inputSchema: {
          target_phase: z.string().describe('The development phase to transition to'),
          reason: z.string().optional().describe('Optional reason for transitioning to this phase now (e.g., "requirements complete", "user requested", "design approved")')
        },
        annotations: {
          title: 'Phase Transition Controller',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (args) => {
        try {
          const result = await this.handleProceedToPhase(args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('proceed_to_phase tool execution failed', error as Error);
          return {
            content: [{
              type: 'text' as const,
              text: `Error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // start_development tool
    this.server.registerTool(
      'start_development',
      {
        description: 'Initialize development workflow and transition to the initial development phase. Choose from predefined workflows or use a custom workflow.',
        inputSchema: {
          workflow: z.enum(this.buildWorkflowEnum())
            .default('waterfall')
            .describe(this.generateWorkflowDescription())
        },
        annotations: {
          title: 'Development Initializer',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (args) => {
        try {
          const result = await this.handleStartDevelopment(args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('start_development tool execution failed', error as Error);
          return {
            content: [{
              type: 'text' as const,
              text: `Error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // resume_workflow tool
    this.server.registerTool(
      'resume_workflow',
      {
        description: 'Resume development workflow after conversation compression. Returns system prompt instructions plus comprehensive project context, current state, and next steps to seamlessly continue development.',
        inputSchema: {
          include_system_prompt: z.boolean().optional().describe('Whether to include system prompt instructions (default: true)'),
          simple_prompt: z.boolean().optional().describe('Whether to use simplified system prompt when included (default: true)')
        },
        annotations: {
          title: 'Workflow Resumption Assistant',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (args) => {
        try {
          const result = await this.handleResumeWorkflow(args);
          
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('resume_workflow tool execution failed', error as Error);
          return {
            content: [{
              type: 'text' as const,
              text: `Error resuming workflow: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // reset_development tool
    this.server.registerTool(
      'reset_development',
      {
        description: 'Reset conversation state and development progress. This permanently deletes conversation state and plan file, while soft-deleting interaction logs for audit trail. Requires explicit confirmation.',
        inputSchema: {
          confirm: z.boolean().describe('Must be true to execute reset - prevents accidental resets'),
          reason: z.string().optional().describe('Optional reason for reset (for logging and audit trail)')
        },
        annotations: {
          title: 'Development Reset Tool',
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false
        }
      },
      async (args) => {
        try {
          const result = await this.handleResetDevelopment(args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('reset_development tool execution failed', error as Error);
          return {
            content: [{
              type: 'text' as const,
              text: `Error resetting development: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );
  }

  /**
   * Setup resource handlers
   */
  private setupResourceHandlers(): void {
    // Development plan resource
    this.server.resource(
      'development-plan',
      'plan://current',
      {
        name: 'Current Development Plan',
        description: 'The active development plan document (markdown) that tracks project progress, tasks, and decisions. This file serves as long-term memory for the development process and should be continuously updated by the LLM.',
        mimeType: 'text/markdown'
      },
      async (uri: any) => {
        try {
          const context = await this.conversationManager.getConversationContext();
          const planContent = await this.planManager.getPlanFileContent(context.planFilePath);
          
          return {
            contents: [{
              uri: uri.href,
              text: planContent,
              mimeType: 'text/markdown'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to retrieve plan resource', error as Error);
          return {
            contents: [{
              uri: uri.href,
              text: `Error loading plan: ${errorMessage}`,
              mimeType: 'text/plain'
            }]
          };
        }
      }
    );

    // Conversation state resource
    this.server.resource(
      'conversation-state',
      'state://current',
      {
        name: 'Current Conversation State',
        description: 'Current conversation state and phase information (JSON) including conversation ID, project context, current development phase, and plan file location. Use this to understand the current state of the development workflow.',
        mimeType: 'application/json'
      },
      async (uri: any) => {
        try {
          const context = await this.conversationManager.getConversationContext();
          
          const stateInfo = {
            conversationId: context.conversationId,
            projectPath: context.projectPath,
            gitBranch: context.gitBranch,
            currentPhase: context.currentPhase,
            planFilePath: context.planFilePath,
            timestamp: new Date().toISOString(),
            description: 'Current state of the development workflow conversation'
          };
          
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(stateInfo, null, 2),
              mimeType: 'application/json'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to retrieve state resource', error as Error);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({ 
                error: errorMessage,
                timestamp: new Date().toISOString()
              }, null, 2),
              mimeType: 'application/json'
            }]
          };
        }
      }
    );
  }

  /**
   * Setup prompt handlers
   */
  private setupPromptHandlers(): void {
    // TODO: Fix prompt handler implementation
    // Temporarily disabled due to API compatibility issues
  }

  /**
   * Handle whats_next tool calls
   * Made public for direct testing access
   */
  public async handleWhatsNext(args: any): Promise<any> {
    try {
      logger.debug('Processing whats_next request', args);
      
      const {
        context = '',
        user_input = '',
        conversation_summary = '',
        recent_messages = []
      } = args;

      // Get conversation (will throw error if none exists)
      let conversationContext;
      try {
        conversationContext = await this.conversationManager.getConversationContext();
      } catch (error) {
        // No conversation exists yet - provide helpful guidance
        logger.info('whats_next called before conversation creation', { error });
        return {
          error: true,
          message: 'No development conversation has been started for this project.',
          instructions: 'Please use the start_development tool first to initialize development with a workflow.',
          available_workflows: this.workflowManager.getWorkflowNames(),
          example: 'start_development({ workflow: "waterfall" })'
        };
      }
      
      const conversationId = conversationContext.conversationId;
      const currentPhase = conversationContext.currentPhase;
      
      logger.debug('Current conversation state', { conversationId, currentPhase });

      // Ensure state machine is loaded for this project
      this.ensureStateMachineForProject(conversationContext.projectPath, conversationContext.workflowName);

      // Ensure plan file exists
      await this.planManager.ensurePlanFile(
        conversationContext.planFilePath,
        conversationContext.projectPath,
        conversationContext.gitBranch
      );

      // Analyze phase transition
      const transitionResult = await this.transitionEngine.analyzePhaseTransition({
        currentPhase,
        projectPath: conversationContext.projectPath,
        userInput: user_input,
        context,
        conversationSummary: conversation_summary,
        recentMessages: recent_messages,
        conversationId: conversationContext.conversationId
      });

      // Update conversation state if phase changed
      if (transitionResult.newPhase !== currentPhase) {
        await this.conversationManager.updateConversationState(
          conversationId,
          { currentPhase: transitionResult.newPhase }
        );
        
        // If this was a first-call auto-transition, regenerate the plan file to reflect the new phase
        if (transitionResult.transitionReason.includes('Starting development - defining criteria')) {
          logger.info('Regenerating plan file after first-call auto-transition', {
            from: currentPhase,
            to: transitionResult.newPhase,
            planFilePath: conversationContext.planFilePath
          });
          
          // Force regeneration of plan file with new phase structure
          await this.planManager.ensurePlanFile(
            conversationContext.planFilePath,
            conversationContext.projectPath,
            conversationContext.gitBranch
          );
        }
        
        logger.info('Phase transition completed', {
          from: currentPhase,
          to: transitionResult.newPhase,
          reason: transitionResult.transitionReason
        });
      }

      // Check if plan file exists
      const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);

      // Generate enhanced instructions
      const instructions = await this.instructionGenerator.generateInstructions(
        transitionResult.instructions,
        {
          phase: transitionResult.newPhase,
          conversationContext: {
            ...conversationContext,
            currentPhase: transitionResult.newPhase
          },
          transitionReason: transitionResult.transitionReason,
          isModeled: transitionResult.isModeled,
          planFileExists: planInfo.exists
        }
      );

      // Prepare response
      const response = {
        phase: transitionResult.newPhase,
        instructions: instructions.instructions,
        plan_file_path: conversationContext.planFilePath,
        transition_reason: transitionResult.transitionReason,
        is_modeled_transition: transitionResult.isModeled,
        conversation_id: conversationContext.conversationId
      };

      // Log interaction
      if (this.interactionLogger) {
        await this.interactionLogger.logInteraction(conversationId, 'whats_next', args, response, transitionResult.newPhase);
      }

      logger.debug('whats_next response generated', response);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('whats_next tool execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Handle proceed_to_phase tool calls
   * Made public for direct testing access
   */
  public async handleProceedToPhase(args: any): Promise<any> {
    try {
      logger.debug('Processing proceed_to_phase request', args);
      
      const { target_phase, reason = '' } = args;

      // Validate target phase
      if (!target_phase) {
        throw new Error('target_phase is required');
      }

      // Get conversation (will throw error if none exists)
      let conversationContext;
      try {
        conversationContext = await this.conversationManager.getConversationContext();
      } catch (error) {
        // No conversation exists yet - provide helpful guidance
        logger.info('proceed_to_phase called before conversation creation', { error });
        return {
          error: true,
          message: 'No development conversation has been started for this project.',
          instructions: 'Please use the start_development tool first to initialize development with a workflow.',
          available_workflows: this.workflowManager.getWorkflowNames(),
          example: 'start_development({ workflow: "waterfall" })'
        };
      }
      
      const conversationId = conversationContext.conversationId;
      const currentPhase = conversationContext.currentPhase;

      // Ensure state machine is loaded for this project
      this.ensureStateMachineForProject(conversationContext.projectPath);

      // Perform explicit transition
      const transitionResult = this.transitionEngine.handleExplicitTransition(
        currentPhase,
        target_phase,
        conversationContext.projectPath,
        reason,
        conversationContext.workflowName
      );

      // Update conversation state
      await this.conversationManager.updateConversationState(
        conversationId,
        { currentPhase: transitionResult.newPhase }
      );
      
      logger.info('Explicit phase transition completed', {
        from: currentPhase,
        to: transitionResult.newPhase,
        reason: transitionResult.transitionReason
      });

      // Ensure plan file exists
      await this.planManager.ensurePlanFile(
        conversationContext.planFilePath,
        conversationContext.projectPath,
        conversationContext.gitBranch
      );

      // Check if plan file exists
      const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);

      // Generate enhanced instructions
      const instructions = await this.instructionGenerator.generateInstructions(
        transitionResult.instructions,
        {
          phase: transitionResult.newPhase,
          conversationContext: {
            ...conversationContext,
            currentPhase: transitionResult.newPhase
          },
          transitionReason: transitionResult.transitionReason,
          isModeled: transitionResult.isModeled,
          planFileExists: planInfo.exists
        }
      );

      // Prepare response
      const response = {
        phase: transitionResult.newPhase,
        instructions: instructions.instructions,
        plan_file_path: conversationContext.planFilePath,
        transition_reason: transitionResult.transitionReason,
        is_modeled_transition: transitionResult.isModeled,
        conversation_id: conversationContext.conversationId
      };

      // Log interaction
      if (this.interactionLogger) {
        await this.interactionLogger.logInteraction(conversationId, 'proceed_to_phase', args, response, transitionResult.newPhase);
      }

      logger.debug('proceed_to_phase response generated', response);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('proceed_to_phase tool execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Handle start_development tool calls
   * Made public for direct testing access
   */
  public async handleStartDevelopment(args: any): Promise<any> {
    try {
      logger.debug('Processing start_development request', args);
      
      // Extract workflow selection from args
      const selectedWorkflow = args.workflow;
      
      // Require explicit workflow selection
      if (!selectedWorkflow) {
        throw new Error('workflow parameter is required. Please specify one of: ' + this.workflowManager.getWorkflowNames().join(', ') + ', or "custom"');
      }
      
      // Validate workflow selection
      if (!this.workflowManager.validateWorkflowName(selectedWorkflow, this.projectPath)) {
        throw new Error(`Invalid workflow: ${selectedWorkflow}. Available workflows: ${this.workflowManager.getWorkflowNames().join(', ')}, custom`);
      }
      
      // Create or get conversation context with the selected workflow
      const conversationContext = await this.conversationManager.createConversationContext(selectedWorkflow);
      const currentPhase = conversationContext.currentPhase;
      
      // Load the selected workflow
      const stateMachine = this.workflowManager.loadWorkflowForProject(conversationContext.projectPath, selectedWorkflow);
      const initialState = stateMachine.initial_state;
      
      // Check if development is already started
      if (currentPhase !== initialState) {
        throw new Error(`Development already started. Current phase is '${currentPhase}', not initial state '${initialState}'. Use whats_next() to continue development.`);
      }
      
      // The initial state IS the first development phase - it's explicitly modeled
      const targetPhase = initialState;
      
      // Transition to the initial development phase
      const transitionResult = await this.transitionEngine.handleExplicitTransition(
        currentPhase,
        targetPhase,
        conversationContext.projectPath,
        'Development initialization',
        selectedWorkflow
      );
      
      // Update conversation state with workflow and phase
      await this.conversationManager.updateConversationState(
        conversationContext.conversationId,
        { 
          currentPhase: transitionResult.newPhase,
          workflowName: selectedWorkflow
        }
      );
      
      // Set state machine on plan manager before creating plan file
      this.planManager.setStateMachine(stateMachine);
      
      // Ensure plan file exists
      await this.planManager.ensurePlanFile(
        conversationContext.planFilePath,
        conversationContext.projectPath,
        conversationContext.gitBranch
      );
      
      const response = {
        phase: transitionResult.newPhase,
        instructions: `Look at the plan file. Define entrance criteria for each phase of the workflow except the initial phase. Those criteria shall be based on the contents of the previous phase. 
        Example: 
        \`\`\`
        ## Design

        ### Phase Entrance Criteria:
        - [ ] The requirements have been thoroughly defined.
        - [ ] Alternatives have been evaluated and are documented. 
        - [ ] It's clear what's in scope and out of scope
        \`\`\`
        
        Once you added reasonable entrance Use the whats_next() tool to get guided instructions for the next current phase.`,
        plan_file_path: conversationContext.planFilePath,
        conversation_id: conversationContext.conversationId,
        workflow: stateMachine
      };
      
      // Log interaction
      if (this.interactionLogger) {
        await this.interactionLogger.logInteraction(conversationContext.conversationId, 'start_development', args, response, transitionResult.newPhase);
      }
      
      logger.debug('start_development response generated', response);
      return response;
      
    } catch (error) {
      logger.error('start_development tool execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Handle resume_workflow tool calls
   * Made public for direct testing access
   */
  public async handleResumeWorkflow(args: any): Promise<any> {
    try {
      logger.debug('Processing resume_workflow request', args);
      
      const includeSystemPrompt = args.include_system_prompt !== false; // Default to true
      const simplePrompt = args.simple_prompt !== false; // Default to true
      
      // Get conversation (will throw error if none exists)
      let conversationContext;
      try {
        conversationContext = await this.conversationManager.getConversationContext();
      } catch (error) {
        // No conversation exists yet - provide helpful guidance
        logger.info('resume_workflow called before conversation creation', { error });
        return {
          error: true,
          message: 'No development conversation has been started for this project.',
          instructions: 'Please use the start_development tool first to initialize development with a workflow.',
          available_workflows: this.workflowManager.getWorkflowNames(),
          example: 'start_development({ workflow: "waterfall" })'
        };
      }
      
      // Get plan file information
      const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);
      
      // Analyze plan file content for key information
      const planAnalysis = planInfo.exists ? this.analyzePlanFile(planInfo.content!) : null;
      
      // Get current state machine information
      const stateMachineInfo = await this.getStateMachineInfo(conversationContext.projectPath, conversationContext.workflowName);
      const stateMachine = this.transitionEngine.getStateMachine(conversationContext.projectPath, conversationContext.workflowName);
      
      // Generate system prompt if requested
      const systemPrompt = includeSystemPrompt ? generateSystemPrompt(stateMachine, simplePrompt) : null;
      
      // Build comprehensive response
      const response = {
        // Core workflow resumption info
        workflow_status: {
          conversation_id: conversationContext.conversationId,
          current_phase: conversationContext.currentPhase,
          project_path: conversationContext.projectPath,
          git_branch: conversationContext.gitBranch,
          state_machine: stateMachineInfo
        },
        
        // Plan file analysis
        plan_status: {
          exists: planInfo.exists,
          path: conversationContext.planFilePath,
          analysis: planAnalysis
        },
        
        // System prompt (if requested)
        system_prompt: systemPrompt,
        
        // Next steps and recommendations
        recommendations: this.generateRecommendations(conversationContext, planAnalysis),
        
        // Metadata
        generated_at: new Date().toISOString(),
        tool_version: '1.0.0'
      };
      
      logger.debug('resume_workflow response generated', { 
        conversationId: conversationContext.conversationId,
        phase: conversationContext.currentPhase,
        planExists: planInfo.exists,
        includeSystemPrompt,
        simplePrompt
      });
      
      return response;
    } catch (error) {
      logger.error('resume_workflow tool execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Handle reset_development tool calls
   * Made public for direct testing access
   */
  public async handleResetDevelopment(args: any): Promise<any> {
    try {
      logger.debug('Processing reset_development request', args);
      
      const confirm = args.confirm;
      const reason = args.reason;
      
      // Validate parameters
      if (typeof confirm !== 'boolean') {
        throw new Error('confirm parameter must be a boolean');
      }
      
      if (!confirm) {
        throw new Error('Reset operation requires explicit confirmation. Set confirm parameter to true.');
      }
      
      // Ensure state machine is loaded for current project
      this.ensureStateMachineForProject(this.projectPath);
      
      // Perform the reset
      const result = await this.conversationManager.resetConversation(confirm, reason);
      
      logger.info('Reset development completed successfully', {
        conversationId: result.conversationId,
        resetItems: result.resetItems,
        reason
      });
      
      return result;
    } catch (error) {
      logger.error('reset_development tool execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Analyze plan file content to extract key information
   */
  private analyzePlanFile(content: string): any {
    const analysis = {
      active_tasks: [] as string[],
      completed_tasks: [] as string[],
      recent_decisions: [] as string[],
      next_steps: [] as string[]
    };

    const lines = content.split('\n');
    let inTaskSection = false;
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.startsWith('##')) {
        currentSection = trimmed.toLowerCase();
        inTaskSection = currentSection.includes('task') || currentSection.includes('todo');
      }
      
      // Extract tasks
      if (inTaskSection) {
        if (trimmed.startsWith('- [x]')) {
          analysis.completed_tasks.push(trimmed.substring(5).trim());
        } else if (trimmed.startsWith('- [ ]')) {
          analysis.active_tasks.push(trimmed.substring(5).trim());
        }
      }
      
      // Extract decisions (look for decision log sections)
      if (currentSection.includes('decision') && trimmed.startsWith('- ')) {
        analysis.recent_decisions.push(trimmed.substring(2).trim());
      }
    }

    return analysis;
  }

  /**
   * Get state machine information
   */
  private async getStateMachineInfo(projectPath: string, workflowName?: string): Promise<any> {
    try {
      // Get the actual state machine for this project
      const stateMachine = this.transitionEngine.getStateMachine(projectPath, workflowName);
      
      // Determine if it's custom or default by checking the name
      const isCustom = stateMachine.name !== 'Classical waterfall';
      
      return {
        type: isCustom ? 'custom' : 'default',
        name: stateMachine.name,
        description: stateMachine.description,
        initial_state: stateMachine.initial_state,
        phases: Object.keys(stateMachine.states),
        phase_descriptions: Object.fromEntries(
          Object.entries(stateMachine.states).map(([phase, definition]) => [
            phase, 
            definition.description
          ])
        )
      };
    } catch (error) {
      logger.warn('Could not determine state machine info', error as Error);
      return {
        type: 'unknown',
        phases: []
      };
    }
  }

  /**
   * Generate recommendations for next steps based on state machine transitions
   */
  private generateRecommendations(context: any, planAnalysis: any): any {
    const recommendations = {
      immediate_actions: [] as string[],
      phase_guidance: '',
      potential_issues: [] as string[]
    };

    try {
      // Get the state machine for this project
      const stateMachine = this.transitionEngine.getStateMachine(context.projectPath, context.workflowName);
      const currentPhase = context.currentPhase;
      const phaseDefinition = stateMachine.states[currentPhase];

      if (phaseDefinition) {
        // Set phase guidance from state machine description
        recommendations.phase_guidance = `Current phase: ${phaseDefinition.description}`;

        // Generate transition-based recommendations
        if (phaseDefinition.transitions && phaseDefinition.transitions.length > 0) {
          recommendations.immediate_actions.push('From here, you can transition to:');
          
          phaseDefinition.transitions.forEach(transition => {
            const targetPhase = stateMachine.states[transition.to];
            const targetDescription = targetPhase ? targetPhase.description : transition.to;
            recommendations.immediate_actions.push(`• ${transition.to}: ${targetDescription}`);
          });

          // Add instruction on how to transition
          recommendations.immediate_actions.push('Use proceed_to_phase() tool when ready to transition');
        } else {
          recommendations.immediate_actions.push('Continue working in current phase');
        }

        // Add current phase specific guidance
        recommendations.immediate_actions.push(`Focus on: ${phaseDefinition.description}`);
      } else {
        // Fallback if phase not found in state machine
        recommendations.phase_guidance = `Current phase: ${currentPhase}`;
        recommendations.immediate_actions.push('Continue working in current phase');
      }

    } catch (error) {
      logger.warn('Could not generate state machine recommendations', error as Error);
      // Basic fallback
      recommendations.phase_guidance = `Current phase: ${context.currentPhase}`;
      recommendations.immediate_actions.push('Continue working in current phase');
    }

    // Plan-based recommendations
    if (planAnalysis) {
      if (planAnalysis.active_tasks.length > 0) {
        recommendations.immediate_actions.push(`Continue working on active tasks: ${planAnalysis.active_tasks.slice(0, 2).join(', ')}`);
      }
      
      if (planAnalysis.active_tasks.length === 0 && planAnalysis.completed_tasks.length > 0) {
        recommendations.potential_issues.push('No active tasks found - may be ready to transition to next phase');
      }
    }

    // Always recommend calling whats_next
    if (!recommendations.immediate_actions.some(action => action.includes('whats_next'))) {
      recommendations.immediate_actions.unshift('Call whats_next() to get current phase-specific guidance');
    }

    return recommendations;
  }





  /**
   * Initialize the server (setup database, etc.)
   */
  public async initialize(): Promise<void> {
    logger.debug('Initializing server components');
    
    // Register MCP server for logging notifications
    setMcpServerForLogging(this.server);
    
    await this.database.initialize();
    
    // Initialization success will be logged automatically by the logger
    
    logger.info('Server initialization completed');
  }

  /**
   * Build workflow enum for Zod schema
   */
  private buildWorkflowEnum(): [string, ...string[]] {
    const workflowNames = this.workflowManager.getWorkflowNames();
    const allWorkflows = [...workflowNames, 'custom'];
    
    // Ensure we have at least one element for TypeScript
    if (allWorkflows.length === 0) {
      return ['waterfall'];
    }
    
    return allWorkflows as [string, ...string[]];
  }

  /**
   * Generate workflow description for tool schema
   */
  private generateWorkflowDescription(): string {
    const workflows = this.workflowManager.getAvailableWorkflows();
    let description = 'Choose your development workflow:\n\n';
    
    for (const workflow of workflows) {
      description += `• **${workflow.name}**: ${workflow.displayName} - ${workflow.description}\n`;
    }
    
    description += '• **custom**: Use custom workflow from .vibe/state-machine.yaml in your project\n\n';
    description += 'Default: waterfall (recommended for larger, design-heavy tasks)';
    
    return description;
  }

  /**
   * Cleanup server resources
   */
  public async cleanup(): Promise<void> {
    logger.debug('Cleaning up server resources');
    if (this.database) {
      await this.database.close();
    }
    logger.info('Server cleanup completed');
  }
}
