/**
 * Transition Engine
 * 
 * Manages the development state machine and determines appropriate phase transitions.
 * Analyzes conversation context and user input to make intelligent phase decisions.
 */

import { createLogger } from './logger.js';
import { StateMachineLoader } from './state-machine-loader.js';

const logger = createLogger('TransitionEngine');

export interface TransitionContext {
  currentPhase: string;
  projectPath: string;
  conversationId: string;
  userInput?: string;
  context?: string;
  conversationSummary?: string;
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface TransitionResult {
  newPhase: string;
  instructions: string;
  transitionReason: string;
  isModeled: boolean;
}

export class TransitionEngine {
  private stateMachineLoader: StateMachineLoader;
  private conversationManager?: { hasInteractions: (conversationId: string) => Promise<boolean> };
  
  constructor(projectPath: string) {
    this.stateMachineLoader = new StateMachineLoader();
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.info('TransitionEngine initialized', { projectPath });
  }
  
  /**
   * Set the conversation manager (dependency injection)
   */
  setConversationManager(conversationManager: { hasInteractions: (conversationId: string) => Promise<boolean> }) {
    this.conversationManager = conversationManager;
  }
  
  /**
   * Get the loaded state machine for the current project
   */
  getStateMachine(projectPath: string) {
    // Ensure we have the latest state machine for this project
    return this.stateMachineLoader.loadStateMachine(projectPath);
  }

  /**
   * Check if this is the first call from initial state based on database interactions
   */
  private async isFirstCallFromInitialState(context: TransitionContext): Promise<boolean> {
    const stateMachine = this.stateMachineLoader.loadStateMachine(context.projectPath);
    const isInitialState = context.currentPhase === stateMachine.initial_state;
    
    if (!isInitialState) return false;
    
    // Check database for any previous interactions in this conversation
    if (!this.conversationManager) {
      logger.warn('ConversationManager not set, assuming first call');
      return true;
    }

    const hasInteractions = await this.conversationManager.hasInteractions(context.conversationId);
    
    logger.debug('Checking first call from initial state', {
      isInitialState,
      hasInteractions,
      conversationId: context.conversationId,
      currentPhase: context.currentPhase
    });
    
    return !hasInteractions;
  }

  /**
   * Generate instructions for defining phase entrance criteria
   */
  private generateCriteriaDefinitionInstructions(projectPath: string): string {
    const stateMachine = this.stateMachineLoader.loadStateMachine(projectPath);
    const phases = Object.keys(stateMachine.states);
    
    let instructions = `Welcome to ${stateMachine.name}!

Before we begin development, let's establish clear entrance criteria for each phase. This will help us make informed decisions about when to transition between phases throughout the development process.

Please update the plan file with a "Phase Entrance Criteria" section that defines specific, measurable criteria for entering each phase:

## Phase Entrance Criteria

`;

    // Generate criteria template for each phase (except initial state)
    phases.forEach(phase => {
      if (phase === stateMachine.initial_state) return; // Skip initial state
      
      const phaseDefinition = stateMachine.states[phase];
      const capitalizedPhase = this.capitalizePhase(phase);
      
      instructions += `### ${capitalizedPhase} Phase
*${phaseDefinition.description}*

**Enter when:**
- [ ] [Define specific criteria for entering ${phase} phase]
- [ ] [Add measurable conditions that must be met]
- [ ] [Include any deliverables or milestones required]

`;
    });

    instructions += `
Once you've defined these criteria, we can begin development. Throughout the process, consult these criteria when considering phase transitions.

**Remember**: These criteria should be specific and measurable so we can clearly determine when each phase is ready to begin.`;

    return instructions;
  }

  /**
   * Get the first development phase from the state machine
   */
  private getFirstDevelopmentPhase(projectPath: string): string {
    const stateMachine = this.stateMachineLoader.loadStateMachine(projectPath);
    const initialState = stateMachine.initial_state;
    
    // Find the first transition from initial state
    const initialStateDefinition = stateMachine.states[initialState];
    if (initialStateDefinition.transitions && initialStateDefinition.transitions.length > 0) {
      return initialStateDefinition.transitions[0].to;
    }
    
    // Fallback: return first non-initial state
    const phases = Object.keys(stateMachine.states);
    const firstNonInitialPhase = phases.find(phase => phase !== initialState);
    
    if (!firstNonInitialPhase) {
      logger.warn('No development phases found, staying in initial state', { initialState, phases });
      return initialState;
    }
    
    return firstNonInitialPhase;
  }
  
  /**
   * Analyze context and determine appropriate phase transition
   */
  async analyzePhaseTransition(context: TransitionContext): Promise<TransitionResult> {
    const { currentPhase, projectPath, userInput, context: additionalContext, conversationSummary } = context;
    
    // Reload state machine for this specific project/conversation
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.debug('Analyzing phase transition', {
      currentPhase,
      projectPath,
      hasUserInput: !!userInput,
      hasContext: !!additionalContext,
      hasSummary: !!conversationSummary,
      userInput: userInput ? userInput.substring(0, 50) + (userInput.length > 50 ? '...' : '') : undefined
    });

    // Check if this is the first call from initial state - transition to first development phase
    if (await this.isFirstCallFromInitialState(context)) {
      const firstDevelopmentPhase = this.getFirstDevelopmentPhase(projectPath);
      
      logger.info('First call from initial state - transitioning to first development phase with criteria', {
        currentPhase,
        firstDevelopmentPhase,
        projectPath
      });
      
      // Combine criteria definition with first phase instructions
      const criteriaInstructions = this.generateCriteriaDefinitionInstructions(projectPath);
      const phaseInstructions = this.stateMachineLoader.getContinuePhaseInstructions(firstDevelopmentPhase);
      
      return {
        newPhase: firstDevelopmentPhase, // Transition to first development phase
        instructions: criteriaInstructions + "\n\n---\n\n" + phaseInstructions,
        transitionReason: "Starting development - defining criteria and beginning first phase",
        isModeled: true
      };
    }

    // For all other cases, stay in current phase and let LLM decide based on plan file criteria
    // The LLM will consult the entrance criteria in the plan file and use proceed_to_phase when ready
    const continueInstructions = this.stateMachineLoader.getContinuePhaseInstructions(currentPhase);
    
    logger.debug('Continuing in current phase - LLM will evaluate transition criteria', {
      currentPhase,
      projectPath
    });
    
    return {
      newPhase: currentPhase,
      instructions: continueInstructions,
      transitionReason: "Continue current phase - LLM will evaluate transition criteria from plan file",
      isModeled: false
    };
  }

  /**
   * Handle explicit phase transition request
   */
  handleExplicitTransition(
    currentPhase: string,
    targetPhase: string,
    projectPath: string,
    reason?: string
  ): TransitionResult {
    // Reload state machine for this specific project/conversation
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.debug('Handling explicit phase transition', {
      currentPhase,
      targetPhase,
      projectPath,
      reason 
    });
    
    // Validate that the target phase exists in the state machine
    if (!this.stateMachineLoader.isValidPhase(targetPhase)) {
      const validPhases = this.stateMachineLoader.getValidPhases();
      const errorMsg = `Invalid target phase: "${targetPhase}". Valid phases are: ${validPhases.join(', ')}`;
      logger.error('Invalid target phase', new Error(errorMsg));
      throw new Error(errorMsg);
    }

    const transitionInfo = this.stateMachineLoader.getTransitionInstructions(
      currentPhase, 
      targetPhase
    );
    
    logger.info('Explicit phase transition processed', {
      fromPhase: currentPhase,
      toPhase: targetPhase,
      reason: reason || transitionInfo.transitionReason,
      isModeled: transitionInfo.isModeled
    });
    
    return {
      newPhase: targetPhase,
      instructions: transitionInfo.instructions,
      transitionReason: reason || transitionInfo.transitionReason,
      isModeled: transitionInfo.isModeled
    };
  }

  /**
   * Capitalize phase name for display
   */
  private capitalizePhase(phase: string): string {
    return phase.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
