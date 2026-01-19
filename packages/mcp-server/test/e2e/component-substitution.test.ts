/**
 * Component Substitution E2E Tests
 *
 * Tests that the strategy pattern component substitution works correctly
 * in different task backend configurations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTempProjectWithDefaultStateMachine } from '../utils/temp-files';
import {
  DirectServerInterface,
  createSuiteIsolatedE2EScenario,
  assertToolSuccess,
  initializeDevelopment,
} from '../utils/e2e-test-setup';

vi.unmock('fs');
vi.unmock('fs/promises');

describe('Component Substitution', () => {
  let client: DirectServerInterface;
  let cleanup: () => Promise<void>;

  describe('Markdown Backend Strategy', () => {
    beforeEach(async () => {
      // Ensure markdown backend is detected
      process.env.TASK_BACKEND = 'markdown';

      const scenario = await createSuiteIsolatedE2EScenario({
        suiteName: 'component-substitution-markdown',
        tempProjectFactory: createTempProjectWithDefaultStateMachine,
      });
      client = scenario.client;
      cleanup = scenario.cleanup;

      await initializeDevelopment(client);
    });

    afterEach(async () => {
      delete process.env.TASK_BACKEND;
      if (cleanup) {
        await cleanup();
      }
    });

    it('should use markdown-based components for plan management', async () => {
      const result = await client.callTool('whats_next', {
        user_input: 'test markdown component substitution',
      });
      const response = assertToolSuccess(result);

      expect(response.phase).toBeTruthy();
      expect(response.instructions).toBeTruthy();
      expect(response.plan_file_path).toBeTruthy();

      // Verify plan file operations work with markdown backend
      expect(response.plan_file_path).toContain('.vibe');
      expect(response.plan_file_path).toMatch(/\.md$/);
    });

    it('should generate markdown-compatible instructions', async () => {
      const result = await client.callTool('whats_next', {
        user_input: 'create feature with markdown backend',
      });
      const response = assertToolSuccess(result);

      // Instructions should be generated using markdown-based strategy
      expect(response.instructions).toContain('Plan File Guidance');
      expect(response.instructions).toContain('Project Context');
      expect(typeof response.instructions).toBe('string');
    });

    it('should handle phase transitions with markdown backend', async () => {
      // Initialize conversation
      await client.callTool('whats_next', { user_input: 'start project' });

      const result = await client.callTool('proceed_to_phase', {
        target_phase: 'design',
        reason: 'requirements complete',
        review_state: 'not-required',
      });
      const response = assertToolSuccess(result);

      expect(response.phase).toBe('design');
      expect(response.instructions).toBeTruthy();
    });
  });

  describe('Backend Strategy Configuration', () => {
    // Note: Actual beads fallback testing requires specific environment setup
    // These tests document the expected behavior when backend fallback occurs

    it.todo('should fallback to default components when beads unavailable');
    it.todo('should generate compatible instructions with fallback strategy');

    // For now, focus on testing the factory pattern mechanism itself
    // rather than specific backend availability scenarios
  });

  describe('Component Factory Integration', () => {
    beforeEach(async () => {
      const scenario = await createSuiteIsolatedE2EScenario({
        suiteName: 'component-substitution-factory',
        tempProjectFactory: createTempProjectWithDefaultStateMachine,
      });
      client = scenario.client;
      cleanup = scenario.cleanup;

      await initializeDevelopment(client);
    });

    afterEach(async () => {
      if (cleanup) {
        await cleanup();
      }
    });

    it('should maintain consistent behavior across component substitutions', async () => {
      // Test multiple operations to ensure consistent component behavior
      const first = await client.callTool('whats_next', {
        user_input: 'first operation',
      });
      const firstResponse = assertToolSuccess(first);

      const second = await client.callTool('proceed_to_phase', {
        target_phase: 'design',
        reason: 'ready to design',
        review_state: 'not-required',
      });
      const secondResponse = assertToolSuccess(second);

      const third = await client.callTool('whats_next', {
        user_input: 'continue after transition',
      });
      const thirdResponse = assertToolSuccess(third);

      // All responses should be consistent and functional
      expect(firstResponse.conversation_id).toBe(
        secondResponse.conversation_id
      );
      expect(secondResponse.conversation_id).toBe(
        thirdResponse.conversation_id
      );
      expect(thirdResponse.phase).toBe('design');
    });

    it('should properly inject dependencies through factory pattern', async () => {
      const result = await client.callTool('whats_next', {
        user_input: 'test dependency injection',
      });
      const response = assertToolSuccess(result);

      // Verify that components work together properly (dependency injection successful)
      expect(response.instructions).toBeTruthy();
      expect(response.plan_file_path).toBeTruthy();

      // Components should be working together to produce complete responses
      expect(response.phase).toBeTruthy();
      expect(response.conversation_id).toBeTruthy();
    });

    it('should handle component errors gracefully', async () => {
      // Test that factory-created components handle edge cases
      const result = await client.callTool('whats_next', {
        user_input: '', // Empty input to test robustness
      });
      const response = assertToolSuccess(result);

      // Should still work with empty input
      expect(response.phase).toBeTruthy();
      expect(response.instructions).toBeTruthy();
    });
  });

  describe('Backend Detection Integration', () => {
    beforeEach(async () => {
      const scenario = await createSuiteIsolatedE2EScenario({
        suiteName: 'component-substitution-detection',
        tempProjectFactory: createTempProjectWithDefaultStateMachine,
      });
      client = scenario.client;
      cleanup = scenario.cleanup;

      await initializeDevelopment(client);
    });

    afterEach(async () => {
      if (cleanup) {
        await cleanup();
      }
    });

    it('should detect task backend and create appropriate components', async () => {
      const result = await client.callTool('whats_next', {
        user_input: 'test backend detection',
      });
      const response = assertToolSuccess(result);

      // Verify the factory correctly detected and created appropriate components
      expect(response.phase).toBeTruthy();
      expect(response.instructions).toBeTruthy();

      // The response should indicate which components are being used
      // (in practice, this would be markdown components since beads isn't available in tests)
      expect(response.plan_file_path).toMatch(/\.md$/);
    });
  });
});
