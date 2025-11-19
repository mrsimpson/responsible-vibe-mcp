/**
 * Database Manager
 *
 * Handles SQLite database operations for conversation state persistence.
 * Uses @sqlite.org/sqlite-wasm for reliable cross-platform WebAssembly bindings.
 */

import sqlite3InitModule, {
  type Database as SqliteDatabase,
  type Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createLogger } from './logger.js';
import type { ConversationState, InteractionLog } from './types.js';
import type { IPersistence } from './persistence-interface.js';

const logger = createLogger('Database');

/**
 * Database connection and operations manager
 * @deprecated Use FileStorage for new implementations. This class will be removed in a future version.
 */
export class Database implements IPersistence {
  private db: SqliteDatabase | null = null;
  private sqlite3: Sqlite3Static | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Initialize SQLite WASM
      this.sqlite3 = await sqlite3InitModule();

      // Always use in-memory database (sqlite-wasm Node.js limitation)
      this.db = new this.sqlite3.oo1.DB();
      logger.debug('Database connection established (in-memory)', {
        originalPath: this.dbPath,
      });

      // Create tables
      await this.createTables();

      // Load existing data from file if it exists
      if (this.dbPath !== ':memory:' && this.dbPath) {
        await this.loadFromFile();
      }

      logger.info('Database initialized successfully', { dbPath: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize database', error as Error);
      throw error;
    }
  }

  /**
   * Load database content from file
   */
  private async loadFromFile(): Promise<void> {
    if (!this.db || !this.dbPath || this.dbPath === ':memory:') {
      return;
    }

    try {
      const { readFile, access } = await import('node:fs/promises');
      await access(this.dbPath);

      const data = await readFile(this.dbPath);
      if (data.length > 0) {
        // Close current in-memory DB and create new one from file data
        this.db.close();
        // Create new DB and deserialize data into it

        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.db = new this.sqlite3!.oo1.DB();
        if (!this.db.pointer) {
          throw new Error('Failed to create database');
        }

        // Convert Buffer to Uint8Array
        const uint8Data = new Uint8Array(data);

        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const wasmPtr = this.sqlite3!.wasm.allocFromTypedArray(uint8Data);

        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.sqlite3!.capi.sqlite3_deserialize(
          this.db.pointer,
          'main',
          wasmPtr,
          data.length,
          data.length,
          0x01 // SQLITE_DESERIALIZE_FREEONCLOSE
        );
        logger.debug('Loaded database from file', {
          dbPath: this.dbPath,
          size: data.length,
        });
      }
    } catch {
      // File doesn't exist - that's OK for new databases
      logger.debug('No existing database file to load', {
        dbPath: this.dbPath,
      });
    }
  }

  /**
   * Save database content to file
   */
  private async saveToFile(): Promise<void> {
    if (!this.db || !this.dbPath || this.dbPath === ':memory:') {
      return;
    }

    try {
      const { writeFile } = await import('node:fs/promises');
      const dbDir = dirname(this.dbPath);
      await mkdir(dbDir, { recursive: true });

      // Export database to Uint8Array and save to file
      if (!this.db.pointer) {
        throw new Error('Database pointer is invalid');
      }
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = this.sqlite3!.capi.sqlite3_js_db_export(this.db.pointer);
      await writeFile(this.dbPath, data);
      logger.debug('Saved database to file', {
        dbPath: this.dbPath,
        size: data.length,
      });
    } catch (error) {
      logger.warn('Failed to save database to file', {
        error: error as Error,
        dbPath: this.dbPath,
      });
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const createConversationStateTable = `
      CREATE TABLE IF NOT EXISTS conversation_state (
        conversationId TEXT PRIMARY KEY,
        projectPath TEXT NOT NULL,
        gitBranch TEXT NOT NULL,
        currentPhase TEXT NOT NULL,
        planFilePath TEXT NOT NULL,
        workflowName TEXT NOT NULL,
        gitCommitConfig TEXT,
        requireReviewsBeforePhaseTransition INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    const createInteractionLogTable = `
      CREATE TABLE IF NOT EXISTS interaction_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId TEXT NOT NULL,
        toolName TEXT NOT NULL,
        inputParams TEXT NOT NULL,
        responseData TEXT NOT NULL,
        currentPhase TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES conversation_state(conversationId)
      )
    `;

    this.db.exec(createConversationStateTable);
    this.db.exec(createInteractionLogTable);

    logger.debug('Database tables created');
  }

  /**
   * Save conversation state to database
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.exec({
      sql: `INSERT OR REPLACE INTO conversation_state
            (conversationId, projectPath, gitBranch, currentPhase, planFilePath, workflowName,
             gitCommitConfig, requireReviewsBeforePhaseTransition, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      bind: [
        state.conversationId,
        state.projectPath,
        state.gitBranch,
        state.currentPhase,
        state.planFilePath,
        state.workflowName,
        state.gitCommitConfig ? JSON.stringify(state.gitCommitConfig) : null,
        state.requireReviewsBeforePhaseTransition ? 1 : 0,
        state.createdAt,
        state.updatedAt,
      ],
    });

    // Persist to file
    await this.saveToFile();

    logger.debug('Conversation state saved', {
      conversationId: state.conversationId,
      currentPhase: state.currentPhase,
    });
  }

  /**
   * Get conversation state by ID
   */
  async getConversationState(
    conversationId: string
  ): Promise<ConversationState | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = this.db.exec({
      sql: 'SELECT * FROM conversation_state WHERE conversationId = ?',
      bind: [conversationId],
      returnValue: 'resultRows',
    });

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      conversationId: row[0] as string,
      projectPath: row[1] as string,
      gitBranch: row[2] as string,
      currentPhase: row[3] as string,
      planFilePath: row[4] as string,
      workflowName: row[5] as string,
      gitCommitConfig: row[6] ? JSON.parse(row[6] as string) : null,
      requireReviewsBeforePhaseTransition: Boolean(row[7]),
      createdAt: row[8] as string,
      updatedAt: row[9] as string,
    };
  }

  /**
   * Get all conversation states
   */
  async getAllConversationStates(): Promise<ConversationState[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = this.db.exec({
      sql: 'SELECT * FROM conversation_state ORDER BY updatedAt DESC',
      returnValue: 'resultRows',
    });

    if (!result) {
      return [];
    }

    return result.map(row => ({
      conversationId: row[0] as string,
      projectPath: row[1] as string,
      gitBranch: row[2] as string,
      currentPhase: row[3] as string,
      planFilePath: row[4] as string,
      workflowName: row[5] as string,
      gitCommitConfig: row[6] ? JSON.parse(row[6] as string) : null,
      requireReviewsBeforePhaseTransition: Boolean(row[7]),
      createdAt: row[8] as string,
      updatedAt: row[9] as string,
    }));
  }

  /**
   * Delete conversation state
   */
  async deleteConversationState(conversationId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.exec({
      sql: 'DELETE FROM conversation_state WHERE conversationId = ?',
      bind: [conversationId],
    });

    // Persist to file
    await this.saveToFile();

    logger.debug('Conversation state deleted', { conversationId });
    return true;
  }

  /**
   * Log interaction
   */
  async logInteraction(log: InteractionLog): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.exec({
      sql: `INSERT INTO interaction_log
            (conversationId, toolName, inputParams, responseData, currentPhase, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)`,
      bind: [
        log.conversationId,
        log.toolName,
        JSON.stringify(log.inputParams),
        JSON.stringify(log.responseData),
        log.currentPhase,
        log.timestamp,
      ],
    });

    // Persist to file
    await this.saveToFile();

    logger.debug('Interaction logged', {
      conversationId: log.conversationId,
      toolName: log.toolName,
    });
  }

  /**
   * Get interaction logs for a conversation
   */
  async getInteractionLogs(conversationId: string): Promise<InteractionLog[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = this.db.exec({
      sql: 'SELECT * FROM interaction_log WHERE conversationId = ? ORDER BY timestamp ASC',
      bind: [conversationId],
      returnValue: 'resultRows',
    });

    if (!result) {
      return [];
    }

    return result.map(row => ({
      id: row[0] as number,
      conversationId: row[1] as string,
      toolName: row[2] as string,
      inputParams: JSON.parse(row[3] as string),
      responseData: JSON.parse(row[4] as string),
      currentPhase: row[5] as string,
      timestamp: row[6] as string,
    }));
  }

  /**
   * Get interaction logs for a conversation (alias for compatibility)
   */
  async getInteractionsByConversationId(
    conversationId: string
  ): Promise<InteractionLog[]> {
    return this.getInteractionLogs(conversationId);
  }

  /**
   * Soft delete interaction logs (for compatibility - actually deletes them)
   */
  async softDeleteInteractionLogs(conversationId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.exec({
      sql: 'DELETE FROM interaction_log WHERE conversationId = ?',
      bind: [conversationId],
    });

    // Persist to file
    await this.saveToFile();

    logger.debug('Interaction logs deleted', { conversationId });
  }

  /**
   * Reset conversation state (for testing)
   */
  async resetConversationState(conversationId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const resetAt = new Date().toISOString();

    this.db.exec({
      sql: 'UPDATE conversation_state SET updatedAt = ? WHERE conversationId = ?',
      bind: [resetAt, conversationId],
    });

    // Persist to file
    await this.saveToFile();

    logger.debug('Conversation state reset', { conversationId, resetAt });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.debug('Database connection closed');
    }
  }
}
