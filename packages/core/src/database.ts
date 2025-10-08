/**
 * Database Manager
 *
 * Handles SQLite database operations for conversation state persistence.
 * Uses better-sqlite3 for reliable cross-platform native bindings.
 */

import BetterSqlite3 from 'better-sqlite3';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createLogger } from './logger.js';
import type { ConversationState, InteractionLog } from './types.js';

const logger = createLogger('Database');

/**
 * Database connection and operations manager
 */
export class Database {
  private db: BetterSqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = dirname(this.dbPath);
      await mkdir(dbDir, { recursive: true });
      logger.debug('Database directory ensured', { dbDir });

      // Create database connection
      this.db = new BetterSqlite3(this.dbPath);
      logger.debug('Database connection established');

      // Create tables
      await this.createTables();
      logger.info('Database initialized successfully', { dbPath: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize database', error as Error);
      throw error;
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
        isReset INTEGER DEFAULT 0,
        resetAt TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversation_state(conversationId)
      )
    `;

    this.db.exec(createConversationStateTable);
    this.db.exec(createInteractionLogTable);
    logger.debug('Tables created successfully');
  }

  /**
   * Save conversation state to database
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO conversation_state 
      (conversationId, projectPath, gitBranch, currentPhase, planFilePath, workflowName, 
       gitCommitConfig, requireReviewsBeforePhaseTransition, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      state.conversationId,
      state.projectPath,
      state.gitBranch,
      state.currentPhase,
      state.planFilePath,
      state.workflowName,
      state.gitCommitConfig ? JSON.stringify(state.gitCommitConfig) : null,
      state.requireReviewsBeforePhaseTransition ? 1 : 0,
      state.createdAt,
      state.updatedAt
    );

    logger.debug('Conversation state saved', {
      conversationId: state.conversationId,
      workflowName: state.workflowName,
      currentPhase: state.currentPhase,
    });
  }

  /**
   * Load conversation state from database
   */
  async loadConversationState(
    conversationId: string
  ): Promise<ConversationState | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(
      'SELECT * FROM conversation_state WHERE conversationId = ?'
    );
    const row = stmt.get(conversationId) as
      | {
          conversationId: string;
          projectPath: string;
          gitBranch: string;
          currentPhase: string;
          planFilePath: string;
          workflowName: string;
          gitCommitConfig: string;
          requireReviewsBeforePhaseTransition: number;
          createdAt: string;
          updatedAt: string;
        }
      | undefined;

    if (row) {
      const state: ConversationState = {
        conversationId: row.conversationId,
        projectPath: row.projectPath,
        gitBranch: row.gitBranch,
        currentPhase: row.currentPhase,
        planFilePath: row.planFilePath,
        workflowName: row.workflowName,
        gitCommitConfig: row.gitCommitConfig
          ? JSON.parse(row.gitCommitConfig)
          : undefined,
        requireReviewsBeforePhaseTransition:
          row.requireReviewsBeforePhaseTransition === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      logger.debug('Conversation state loaded', {
        conversationId,
        workflowName: state.workflowName,
        currentPhase: state.currentPhase,
      });
      return state;
    }

    logger.debug('No conversation state found', { conversationId });
    return null;
  }

  /**
   * Get conversation state by ID (alias for loadConversationState)
   */
  async getConversationState(
    conversationId: string
  ): Promise<ConversationState | null> {
    return this.loadConversationState(conversationId);
  }

  /**
   * List all conversation states
   */
  async listConversationStates(): Promise<ConversationState[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(
      'SELECT * FROM conversation_state ORDER BY updatedAt DESC'
    );
    const rows = stmt.all() as {
      conversationId: string;
      projectPath: string;
      gitBranch: string;
      currentPhase: string;
      planFilePath: string;
      workflowName: string;
      gitCommitConfig: string;
      requireReviewsBeforePhaseTransition: number;
      createdAt: string;
      updatedAt: string;
    }[];

    const states = rows.map(row => ({
      conversationId: row.conversationId,
      projectPath: row.projectPath,
      gitBranch: row.gitBranch,
      currentPhase: row.currentPhase,
      planFilePath: row.planFilePath,
      workflowName: row.workflowName,
      gitCommitConfig: row.gitCommitConfig
        ? JSON.parse(row.gitCommitConfig)
        : undefined,
      requireReviewsBeforePhaseTransition:
        row.requireReviewsBeforePhaseTransition === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    logger.debug('Listed conversation states', { count: states.length });
    return states;
  }

  /**
   * Delete conversation state
   */
  async deleteConversationState(conversationId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(
      'DELETE FROM conversation_state WHERE conversationId = ?'
    );
    const result = stmt.run(conversationId);

    const deleted = result.changes > 0;
    logger.debug('Conversation state deletion', { conversationId, deleted });
    return deleted;
  }

  /**
   * Log an interaction to the database
   */
  async logInteraction(log: InteractionLog): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO interaction_log 
      (conversationId, toolName, inputParams, responseData, currentPhase, timestamp, isReset, resetAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.conversationId,
      log.toolName,
      log.inputParams,
      log.responseData,
      log.currentPhase,
      log.timestamp,
      log.isReset ? 1 : 0,
      log.resetAt || null
    );

    logger.debug('Interaction logged', {
      conversationId: log.conversationId,
      toolName: log.toolName,
      timestamp: log.timestamp,
    });
  }

  /**
   * Get interactions by conversation ID
   */
  async getInteractionsByConversationId(
    conversationId: string
  ): Promise<InteractionLog[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM interaction_log 
      WHERE conversationId = ? AND (isReset = 0 OR isReset IS NULL)
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(conversationId) as {
      id: number;
      conversationId: string;
      toolName: string;
      inputParams: string;
      responseData: string;
      currentPhase: string;
      timestamp: string;
      isReset: number;
      resetAt: string;
    }[];

    const logs = rows.map(row => ({
      id: row.id,
      conversationId: row.conversationId,
      toolName: row.toolName,
      inputParams: row.inputParams,
      responseData: row.responseData,
      currentPhase: row.currentPhase,
      timestamp: row.timestamp,
      isReset: row.isReset === 1,
      resetAt: row.resetAt,
    }));

    logger.debug('Retrieved interaction logs', {
      conversationId,
      count: logs.length,
    });
    return logs;
  }

  /**
   * Soft delete interaction logs by marking them as reset
   */
  async softDeleteInteractionLogs(conversationId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const resetAt = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE interaction_log 
      SET isReset = 1, resetAt = ?
      WHERE conversationId = ? AND (isReset = 0 OR isReset IS NULL)
    `);

    const result = stmt.run(resetAt, conversationId);
    logger.debug('Soft deleted interaction logs', {
      conversationId,
      affectedRows: result.changes,
    });
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

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }
}
