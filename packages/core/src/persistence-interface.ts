/**
 * Persistence Interface
 *
 * Defines the contract for conversation state and interaction log persistence.
 * This interface abstracts the storage mechanism, allowing for different
 * implementations (SQLite, file-based, etc.) to be used interchangeably.
 */

import type { ConversationState, InteractionLog } from './types.js';

/**
 * Interface for persistence operations
 *
 * Implementations must handle errors gracefully, especially user-corrupted data:
 * - Missing files/data should return null or empty arrays
 * - Corrupted data should be logged but not crash the application
 * - Partial recovery should be attempted when possible (e.g., skip corrupted lines)
 */
export interface IPersistence {
  /**
   * Initialize the persistence layer
   * Creates necessary storage structures (tables, directories, etc.)
   *
   * @throws Error if initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Save or update a conversation state
   *
   * @param state - The conversation state to save
   * @throws Error if save operation fails
   */
  saveConversationState(state: ConversationState): Promise<void>;

  /**
   * Get a conversation state by ID
   *
   * @param conversationId - The conversation ID to retrieve
   * @returns The conversation state, or null if not found or corrupted
   */
  getConversationState(
    conversationId: string
  ): Promise<ConversationState | null>;

  /**
   * Get all conversation states
   *
   * @returns Array of all conversation states (skips corrupted entries)
   */
  getAllConversationStates(): Promise<ConversationState[]>;

  /**
   * Delete a conversation state
   *
   * @param conversationId - The conversation ID to delete
   * @returns True if deleted, false if not found
   */
  deleteConversationState(conversationId: string): Promise<boolean>;

  /**
   * Log an interaction
   *
   * @param log - The interaction log entry to save
   * @throws Error if logging fails
   */
  logInteraction(log: InteractionLog): Promise<void>;

  /**
   * Get interaction logs for a conversation
   *
   * @param conversationId - The conversation ID to get logs for
   * @returns Array of interaction logs (skips corrupted entries, empty if none exist)
   */
  getInteractionLogs(conversationId: string): Promise<InteractionLog[]>;

  /**
   * Get interaction logs by conversation ID (alias for compatibility)
   *
   * @param conversationId - The conversation ID to get logs for
   * @returns Array of interaction logs (skips corrupted entries, empty if none exist)
   */
  getInteractionsByConversationId(
    conversationId: string
  ): Promise<InteractionLog[]>;

  /**
   * Soft delete interaction logs for a conversation
   * (Actual behavior depends on implementation - may be hard delete)
   *
   * @param conversationId - The conversation ID to delete logs for
   */
  softDeleteInteractionLogs(conversationId: string): Promise<void>;

  /**
   * Reset conversation state (update timestamp)
   * Used for testing and state management
   *
   * @param conversationId - The conversation ID to reset
   */
  resetConversationState(conversationId: string): Promise<void>;

  /**
   * Close the persistence layer and clean up resources
   */
  close(): Promise<void>;
}
