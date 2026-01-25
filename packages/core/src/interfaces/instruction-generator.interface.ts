/**
 * Instruction Generator Interface
 *
 * Defines the contract for instruction generation functionality.
 * Enables strategy pattern implementation for different task backends.
 */

import type { ConversationContext } from '../types.js';
import type { YamlStateMachine } from '../state-machine-types.js';

export interface InstructionContext {
  phase: string;
  conversationContext: ConversationContext;
  transitionReason: string;
  isModeled: boolean;
  planFileExists: boolean;
  /** Source of the instruction generation request - helps generators adapt output */
  instructionSource: 'proceed_to_phase' | 'whats_next';
}

export interface GeneratedInstructions {
  instructions: string;
  planFileGuidance: string;
  metadata: {
    phase: string;
    planFilePath: string;
    transitionReason: string;
    isModeled: boolean;
  };
}

/**
 * Interface for instruction generation operations
 * All instruction generators must implement this interface
 */
export interface IInstructionGenerator {
  /**
   * Set the state machine definition for dynamic instruction generation
   */
  setStateMachine(stateMachine: YamlStateMachine): void;

  /**
   * Generate comprehensive instructions for the LLM
   */
  generateInstructions(
    baseInstructions: string,
    context: InstructionContext
  ): Promise<GeneratedInstructions>;
}
