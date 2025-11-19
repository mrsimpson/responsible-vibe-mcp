/**
 * File-Based Storage Implementation
 *
 * Implements the IPersistence interface using a file-based approach with
 * directory-per-conversation structure. Provides transparent, human-readable
 * persistence without SQLite dependencies.
 *
 * Directory Structure:
 *   .vibe/conversations/{conversationId}/
 *     state.json          - ConversationState data
 *     interactions.jsonl  - Append-only interaction logs (one JSON per line)
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { createLogger } from './logger.js';
import type { IPersistence } from './persistence-interface.js';
import type { ConversationState, InteractionLog } from './types.js';
import { autoMigrateIfNeeded } from './migration.js';

const logger = createLogger('FileStorage');

/**
 * File-based persistence implementation
 */
export class FileStorage implements IPersistence {
  private conversationsDir: string;
  private basePath: string;

  /**
   * @param basePath - Path to the storage location (e.g., .vibe/conversation.sqlite for backward compat)
   *                   In the future, this should just be the .vibe directory path.
   *                   TODO: Change to accept .vibe directory path directly in v5.0 (see issue #155)
   */
  constructor(basePath: string) {
    // For backward compatibility, basePath currently points to where conversation.sqlite was
    // We derive the conversations directory from this
    // TODO: In v5.0, accept .vibe directory path directly and use join(basePath, 'conversations')
    this.basePath = basePath;
    this.conversationsDir = join(dirname(basePath), 'conversations');
  }

  /**
   * Initialize file-based storage
   * Creates the conversations directory if it doesn't exist
   * Automatically migrates from legacy SQLite if needed
   */
  async initialize(): Promise<void> {
    try {
      // Check for legacy SQLite and migrate if needed
      await autoMigrateIfNeeded(this.basePath);

      // Create conversations directory
      await fs.mkdir(this.conversationsDir, { recursive: true });
      logger.debug('FileStorage initialized', {
        conversationsDir: this.conversationsDir,
      });
    } catch (error) {
      logger.error('Failed to initialize FileStorage', error as Error);
      throw error;
    }
  }

  /**
   * Get the directory path for a conversation
   */
  private getConversationDir(conversationId: string): string {
    return join(this.conversationsDir, conversationId);
  }

  /**
   * Get the state file path for a conversation
   */
  private getStateFilePath(conversationId: string): string {
    return join(this.getConversationDir(conversationId), 'state.json');
  }

  /**
   * Get the interactions file path for a conversation
   */
  private getInteractionsFilePath(conversationId: string): string {
    return join(this.getConversationDir(conversationId), 'interactions.jsonl');
  }

  /**
   * Write data atomically using temp file + rename
   * Uses unique temp file names to prevent concurrent write collisions
   */
  private async writeAtomic(filePath: string, data: string): Promise<void> {
    // Use timestamp + random suffix to ensure unique temp file names for concurrent operations
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const tempPath = `${filePath}.tmp.${uniqueSuffix}`;
    try {
      await fs.writeFile(tempPath, data, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Save or update a conversation state
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    const conversationDir = this.getConversationDir(state.conversationId);
    const stateFilePath = this.getStateFilePath(state.conversationId);

    try {
      // Ensure conversation directory exists
      await fs.mkdir(conversationDir, { recursive: true });

      // Write state atomically
      const stateJson = JSON.stringify(state, null, 2);
      await this.writeAtomic(stateFilePath, stateJson);

      logger.debug('Conversation state saved', {
        conversationId: state.conversationId,
        currentPhase: state.currentPhase,
      });
    } catch (error) {
      logger.error('Failed to save conversation state', error as Error, {
        conversationId: state.conversationId,
      });
      throw error;
    }
  }

  /**
   * Get a conversation state by ID
   * Returns null if not found or corrupted
   */
  async getConversationState(
    conversationId: string
  ): Promise<ConversationState | null> {
    const stateFilePath = this.getStateFilePath(conversationId);

    try {
      const stateJson = await fs.readFile(stateFilePath, 'utf-8');
      const state = JSON.parse(stateJson) as ConversationState;
      return state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - return null (expected for non-existent conversations)
        return null;
      }

      // JSON parse error or other error - log warning and return null
      logger.warn('Failed to read conversation state, returning null', {
        conversationId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Get all conversation states
   * Skips corrupted state files
   */
  async getAllConversationStates(): Promise<ConversationState[]> {
    try {
      const entries = await fs.readdir(this.conversationsDir, {
        withFileTypes: true,
      });

      const states: ConversationState[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const conversationId = entry.name;
          const state = await this.getConversationState(conversationId);
          if (state) {
            states.push(state);
          }
          // Corrupted states are already logged and skipped by getConversationState
        }
      }

      // Sort by updatedAt DESC (most recent first)
      states.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return states;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Conversations directory doesn't exist yet - return empty array
        return [];
      }

      logger.error('Failed to get all conversation states', error as Error);
      throw error;
    }
  }

  /**
   * Delete a conversation state
   * Returns true if deleted, false if not found
   */
  async deleteConversationState(conversationId: string): Promise<boolean> {
    const conversationDir = this.getConversationDir(conversationId);

    try {
      await fs.rm(conversationDir, { recursive: true, force: true });
      logger.debug('Conversation state deleted', { conversationId });
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Directory doesn't exist - return false
        return false;
      }

      logger.error('Failed to delete conversation state', error as Error, {
        conversationId,
      });
      throw error;
    }
  }

  /**
   * Log an interaction
   * Appends to interactions.jsonl file
   */
  async logInteraction(log: InteractionLog): Promise<void> {
    const interactionsFilePath = this.getInteractionsFilePath(
      log.conversationId
    );
    const conversationDir = this.getConversationDir(log.conversationId);

    try {
      // Ensure conversation directory exists
      await fs.mkdir(conversationDir, { recursive: true });

      // Append to JSONL file (one JSON per line)
      const logLine = JSON.stringify(log) + '\n';
      await fs.appendFile(interactionsFilePath, logLine, 'utf-8');

      logger.debug('Interaction logged', {
        conversationId: log.conversationId,
        toolName: log.toolName,
      });
    } catch (error) {
      logger.error('Failed to log interaction', error as Error, {
        conversationId: log.conversationId,
        toolName: log.toolName,
      });
      throw error;
    }
  }

  /**
   * Get interaction logs for a conversation
   * Skips corrupted JSONL lines, returns empty array if file doesn't exist
   */
  async getInteractionLogs(conversationId: string): Promise<InteractionLog[]> {
    const interactionsFilePath = this.getInteractionsFilePath(conversationId);

    try {
      const content = await fs.readFile(interactionsFilePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      const logs: InteractionLog[] = [];

      for (const line of lines) {
        try {
          const log = JSON.parse(line) as InteractionLog;
          logs.push(log);
        } catch {
          // Skip corrupted line, log warning
          logger.warn('Skipping corrupted interaction log line', {
            conversationId,
          });
        }
      }

      return logs;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - return empty array
        return [];
      }

      logger.error('Failed to get interaction logs', error as Error, {
        conversationId,
      });
      throw error;
    }
  }

  /**
   * Get interaction logs by conversation ID (alias for compatibility)
   */
  async getInteractionsByConversationId(
    conversationId: string
  ): Promise<InteractionLog[]> {
    return this.getInteractionLogs(conversationId);
  }

  /**
   * Soft delete interaction logs
   * Actually performs hard delete (removes interactions.jsonl file)
   */
  async softDeleteInteractionLogs(conversationId: string): Promise<void> {
    const interactionsFilePath = this.getInteractionsFilePath(conversationId);

    try {
      await fs.unlink(interactionsFilePath);
      logger.debug('Interaction logs deleted', { conversationId });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - nothing to delete
        return;
      }

      logger.warn('Failed to delete interaction logs', {
        conversationId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Reset conversation state (update timestamp)
   */
  async resetConversationState(conversationId: string): Promise<void> {
    const state = await this.getConversationState(conversationId);

    if (!state) {
      throw new Error(`Conversation state not found for ID: ${conversationId}`);
    }

    const updatedState: ConversationState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    await this.saveConversationState(updatedState);

    logger.debug('Conversation state reset', { conversationId });
  }

  /**
   * Close file storage (no-op for file-based storage)
   */
  async close(): Promise<void> {
    logger.debug('FileStorage closed');
  }
}
