/**
 * Comprehensive Persistence Tests
 *
 * Tests the IPersistence interface behavior. These tests are implementation-agnostic
 * and should pass for both Database (SQLite) and FileStorage (file-based) implementations.
 *
 * Focus: Application-facing behavior and user-corruption scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStorage } from '../../src/file-storage.js';
import type { IPersistence } from '../../src/persistence-interface.js';
import type { ConversationState, InteractionLog } from '../../src/types.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/**
 * Factory function to create a persistence instance for testing
 * Change this to test different implementations
 */
async function createPersistenceInstance(
  testPath: string
): Promise<IPersistence> {
  // Testing FileStorage (file-based) implementation
  const persistence = new FileStorage(join(testPath, 'test.sqlite'));
  await persistence.initialize();
  return persistence;
}

describe('IPersistence Interface Tests', () => {
  let persistence: IPersistence;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp('/tmp/persistence-test-');
    persistence = await createPersistenceInstance(tempDir);
  });

  afterEach(async () => {
    // Clean up
    await persistence.close();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('saveConversationState()', () => {
    it('should create a new conversation state', async () => {
      const state: ConversationState = {
        conversationId: 'test-conv-1',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistence.saveConversationState(state);

      const retrieved = await persistence.getConversationState('test-conv-1');
      // Note: Database may add gitCommitConfig: null, so we check without strict equality
      expect(retrieved).toMatchObject(state);
      expect(retrieved?.conversationId).toBe('test-conv-1');
    });

    it('should update an existing conversation state', async () => {
      const state: ConversationState = {
        conversationId: 'test-conv-2',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save initial state
      await persistence.saveConversationState(state);

      // Update state
      const updatedState = { ...state, currentPhase: 'plan' };
      await persistence.saveConversationState(updatedState);

      // Verify update
      const retrieved = await persistence.getConversationState('test-conv-2');
      expect(retrieved?.currentPhase).toBe('plan');
    });
  });

  describe('getConversationState()', () => {
    it('should retrieve an existing conversation state', async () => {
      const state: ConversationState = {
        conversationId: 'test-conv-3',
        projectPath: '/test/project',
        gitBranch: 'feature',
        currentPhase: 'code',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'waterfall',
        requireReviewsBeforePhaseTransition: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistence.saveConversationState(state);
      const retrieved = await persistence.getConversationState('test-conv-3');

      // Note: Database may add gitCommitConfig: null, so we use toMatchObject
      expect(retrieved).toMatchObject(state);
      expect(retrieved?.requireReviewsBeforePhaseTransition).toBe(true);
    });

    it('should return null when conversation does not exist', async () => {
      const retrieved = await persistence.getConversationState('non-existent');
      expect(retrieved).toBeNull();
    });

    // Note: User-corruption tests (corrupted JSON) will be implementation-specific
    // and should be added in FileStorage tests, not here for Database
  });

  describe('getAllConversationStates()', () => {
    it('should return all valid conversation states', async () => {
      const state1: ConversationState = {
        conversationId: 'test-conv-4',
        projectPath: '/test/project1',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project1/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const state2: ConversationState = {
        conversationId: 'test-conv-5',
        projectPath: '/test/project2',
        gitBranch: 'feature',
        currentPhase: 'code',
        planFilePath: '/test/project2/.vibe/plan.md',
        workflowName: 'waterfall',
        requireReviewsBeforePhaseTransition: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistence.saveConversationState(state1);
      await persistence.saveConversationState(state2);

      const allStates = await persistence.getAllConversationStates();
      expect(allStates).toHaveLength(2);
      expect(allStates.map(s => s.conversationId)).toContain('test-conv-4');
      expect(allStates.map(s => s.conversationId)).toContain('test-conv-5');
    });

    it('should return empty array when no states exist', async () => {
      const allStates = await persistence.getAllConversationStates();
      expect(allStates).toEqual([]);
    });
  });

  describe('deleteConversationState()', () => {
    it('should remove a conversation state successfully', async () => {
      const state: ConversationState = {
        conversationId: 'test-conv-6',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistence.saveConversationState(state);
      await persistence.deleteConversationState('test-conv-6');

      const retrieved = await persistence.getConversationState('test-conv-6');
      expect(retrieved).toBeNull();
    });
  });

  describe('logInteraction()', () => {
    it('should append an interaction log', async () => {
      const log: InteractionLog = {
        conversationId: 'test-conv-7',
        toolName: 'whats_next',
        inputParams: JSON.stringify({ context: 'test' }),
        responseData: JSON.stringify({ phase: 'explore' }),
        currentPhase: 'explore',
        timestamp: new Date().toISOString(),
      };

      await persistence.logInteraction(log);

      const logs = await persistence.getInteractionLogs('test-conv-7');
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        conversationId: 'test-conv-7',
        toolName: 'whats_next',
        currentPhase: 'explore',
      });
    });
  });

  describe('getInteractionLogs()', () => {
    it('should retrieve logs for a conversation', async () => {
      const log1: InteractionLog = {
        conversationId: 'test-conv-8',
        toolName: 'start_development',
        inputParams: JSON.stringify({ workflow: 'epcc' }),
        responseData: JSON.stringify({ phase: 'explore' }),
        currentPhase: 'explore',
        timestamp: new Date().toISOString(),
      };

      const log2: InteractionLog = {
        conversationId: 'test-conv-8',
        toolName: 'whats_next',
        inputParams: JSON.stringify({ context: 'test' }),
        responseData: JSON.stringify({ phase: 'explore' }),
        currentPhase: 'explore',
        timestamp: new Date().toISOString(),
      };

      await persistence.logInteraction(log1);
      await persistence.logInteraction(log2);

      const logs = await persistence.getInteractionLogs('test-conv-8');
      expect(logs).toHaveLength(2);
    });

    it('should return empty array when no logs exist', async () => {
      const logs = await persistence.getInteractionLogs('non-existent');
      expect(logs).toEqual([]);
    });

    // Note: User-corruption tests (corrupted JSONL) will be implementation-specific
    // and should be added in FileStorage tests
  });

  describe('softDeleteInteractionLogs()', () => {
    it('should delete interaction logs successfully', async () => {
      const log: InteractionLog = {
        conversationId: 'test-conv-9',
        toolName: 'whats_next',
        inputParams: JSON.stringify({ context: 'test' }),
        responseData: JSON.stringify({ phase: 'explore' }),
        currentPhase: 'explore',
        timestamp: new Date().toISOString(),
      };

      await persistence.logInteraction(log);
      await persistence.softDeleteInteractionLogs('test-conv-9');

      const logs = await persistence.getInteractionLogs('test-conv-9');
      expect(logs).toEqual([]);
    });
  });

  describe('initialize()', () => {
    it('should set up persistence successfully', async () => {
      // Already tested in beforeEach, but verify explicitly
      expect(persistence).toBeDefined();

      // Verify we can save data after initialization
      const state: ConversationState = {
        conversationId: 'test-conv-10',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(
        persistence.saveConversationState(state)
      ).resolves.not.toThrow();
    });
  });

  describe('close()', () => {
    it('should clean up resources', async () => {
      await expect(persistence.close()).resolves.not.toThrow();
    });
  });
});
