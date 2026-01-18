/**
 * Beads Task Validation Tests
 *
 * Tests beads task completion validation functionality focusing on:
 * - BeadsStateManager state management
 * - Error handling and graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { BeadsStateManager } from '../../packages/core/src/index.js';

describe('Beads Task Validation', () => {
  let tempDir: string;
  let beadsStateManager: BeadsStateManager;

  beforeEach(async () => {
    // Create temporary directory for test
    tempDir = await fs.mkdtemp('/tmp/test-beads-validation-');

    // Create .vibe directory
    await fs.mkdir(`${tempDir}/.vibe`, { recursive: true });

    beadsStateManager = new BeadsStateManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('BeadsStateManager Unit Tests', () => {
    it('should create and retrieve beads state', async () => {
      const conversationId = 'test-conversation-123';
      const epicId = 'epic-456';
      const phaseTasks = [
        { phaseId: 'explore', phaseName: 'Explore', taskId: 'task-1' },
        { phaseId: 'plan', phaseName: 'Plan', taskId: 'task-2' },
      ];

      // Create state
      const createdState = await beadsStateManager.createState(
        conversationId,
        epicId,
        phaseTasks
      );

      expect(createdState.conversationId).toBe(conversationId);
      expect(createdState.epicId).toBe(epicId);
      expect(createdState.phaseTasks).toEqual(phaseTasks);

      // Retrieve state
      const retrievedState = await beadsStateManager.getState(conversationId);
      expect(retrievedState).toBeDefined();
      expect(retrievedState?.conversationId).toBe(conversationId);
      expect(retrievedState?.epicId).toBe(epicId);

      // Get specific phase task ID
      const exploreTaskId = await beadsStateManager.getPhaseTaskId(
        conversationId,
        'explore'
      );
      expect(exploreTaskId).toBe('task-1');

      const planTaskId = await beadsStateManager.getPhaseTaskId(
        conversationId,
        'plan'
      );
      expect(planTaskId).toBe('task-2');

      // Non-existent phase should return null
      const nonExistentTaskId = await beadsStateManager.getPhaseTaskId(
        conversationId,
        'nonexistent'
      );
      expect(nonExistentTaskId).toBeNull();
    });

    it('should return null for non-existent conversation', async () => {
      const state = await beadsStateManager.getState(
        'non-existent-conversation'
      );
      expect(state).toBeNull();

      const taskId = await beadsStateManager.getPhaseTaskId(
        'non-existent-conversation',
        'explore'
      );
      expect(taskId).toBeNull();
    });

    it('should handle file system errors gracefully', async () => {
      const conversationId = 'test-conversation-456';

      // Create invalid directory structure to trigger errors
      const invalidPath = '/invalid/path/that/does/not/exist';
      const invalidBeadsManager = new BeadsStateManager(invalidPath);

      // Should handle creation errors
      await expect(
        invalidBeadsManager.createState(conversationId, 'epic-123', [])
      ).rejects.toThrow();

      // Should handle retrieval errors gracefully (return null)
      const state = await invalidBeadsManager.getState(conversationId);
      expect(state).toBeNull();
    });

    it('should support updating beads state', async () => {
      const conversationId = 'test-conversation-789';
      const epicId = 'epic-original';
      const originalPhaseTasks = [
        { phaseId: 'explore', phaseName: 'Explore', taskId: 'task-1' },
      ];

      // Create initial state
      await beadsStateManager.createState(
        conversationId,
        epicId,
        originalPhaseTasks
      );

      // Update state with new phase tasks
      const newPhaseTasks = [
        { phaseId: 'explore', phaseName: 'Explore', taskId: 'task-1' },
        { phaseId: 'plan', phaseName: 'Plan', taskId: 'task-2' },
      ];

      const updatedState = await beadsStateManager.updateState(conversationId, {
        phaseTasks: newPhaseTasks,
      });

      expect(updatedState).toBeDefined();
      expect(updatedState?.phaseTasks).toEqual(newPhaseTasks);
      expect(updatedState?.epicId).toBe(epicId); // Should remain unchanged

      // Verify update persisted
      const retrievedState = await beadsStateManager.getState(conversationId);
      expect(retrievedState?.phaseTasks).toEqual(newPhaseTasks);
    });

    it('should handle update of non-existent state', async () => {
      const result = await beadsStateManager.updateState('non-existent', {
        epicId: 'new-epic',
      });

      expect(result).toBeNull();
    });

    it('should check state existence', async () => {
      const conversationId = 'test-existence-check';

      // Should return false for non-existent state
      expect(await beadsStateManager.hasState(conversationId)).toBe(false);

      // Create state
      await beadsStateManager.createState(conversationId, 'epic-123', []);

      // Should return true for existing state
      expect(await beadsStateManager.hasState(conversationId)).toBe(true);
    });

    it('should handle cleanup gracefully', async () => {
      const conversationId = 'test-cleanup';

      // Cleanup non-existent state should not throw
      await expect(
        beadsStateManager.cleanup(conversationId)
      ).resolves.toBeUndefined();

      // Create state and cleanup
      await beadsStateManager.createState(conversationId, 'epic-123', []);
      await expect(
        beadsStateManager.cleanup(conversationId)
      ).resolves.toBeUndefined();
    });
  });
});
