/**
 * Phase Persistence Tests
 *
 * Tests that conversation phase state is correctly maintained across tool calls.
 * Ensures that when proceed_to_phase updates the conversation phase,
 * subsequent whats_next calls correctly return the updated phase.
 *
 * This validates that:
 * - Phase transitions are properly persisted to the database
 * - The transition engine correctly identifies whether it's the first call
 * - Interaction logging works independently of general logging settings
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { createResponsibleVibeMCPServer } from '../../packages/mcp-server/src/server.js';
import type { ResponsibleVibeMCPServer } from '../../packages/mcp-server/src/server.js';
import type { WhatsNextResult } from '../../packages/mcp-server/src/tool-handlers/whats-next.js';
import type { ProceedToPhaseResult } from '../../packages/mcp-server/src/tool-handlers/proceed-to-phase.js';
import type { StartDevelopmentResult } from '../../packages/mcp-server/src/tool-handlers/start-development.js';

describe('Phase Persistence', () => {
  let server: ResponsibleVibeMCPServer;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test
    tempDir = await fs.mkdtemp('/tmp/test-phase-persistence-');

    // Create a minimal .git directory so git branch detection works
    // Use a feature branch (not main/master) to avoid branch prompt
    await fs.mkdir(`${tempDir}/.git`, { recursive: true });
    await fs.writeFile(
      `${tempDir}/.git/HEAD`,
      'ref: refs/heads/feature/test-phase-persistence'
    );

    // Create mock project docs to satisfy artifact checking for waterfall workflow
    await fs.mkdir(`${tempDir}/.vibe/docs`, { recursive: true });
    await fs.writeFile(
      `${tempDir}/.vibe/docs/architecture.md`,
      '# Architecture\n\nMock architecture'
    );
    await fs.writeFile(
      `${tempDir}/.vibe/docs/requirements.md`,
      '# Requirements\n\nMock requirements'
    );
    await fs.writeFile(
      `${tempDir}/.vibe/docs/design.md`,
      '# Design\n\nMock design'
    );

    // Create server with temp directory as project path
    // Note: enableLogging is false to verify interaction tracking works independently
    server = await createResponsibleVibeMCPServer({
      projectPath: tempDir,
      enableLogging: false,
    });
    await server.initialize();
  });

  afterEach(async () => {
    // Clean up server
    await server.cleanup();

    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should persist phase changes across multiple whats_next calls', async () => {
    // Start development with waterfall workflow
    const startResult = (await server.handleStartDevelopment({
      workflow: 'waterfall',
      commit_behaviour: 'none',
      require_reviews: false,
    })) as StartDevelopmentResult;

    expect(startResult.phase).toBeDefined();
    const initialPhase = startResult.phase;

    // Verify initial phase is returned by whats_next
    const whatsNextResult1 = (await server.handleWhatsNext({
      context: 'Initial check',
      user_input: 'Starting development',
    })) as WhatsNextResult;

    expect(whatsNextResult1.phase).toBe(initialPhase);

    // Explicitly transition to a new phase
    const newPhase = 'design';
    const proceedResult = (await server.handleProceedToPhase({
      target_phase: newPhase,
      reason: 'Requirements complete',
      review_state: 'not-required',
    })) as ProceedToPhaseResult;

    expect(proceedResult.phase).toBe(newPhase);

    // Verify the phase change persists in subsequent whats_next calls
    const whatsNextResult2 = (await server.handleWhatsNext({
      context: 'Check phase after transition',
      user_input: 'Continuing work',
    })) as WhatsNextResult;

    // whats_next should return the updated phase, not the initial phase
    expect(whatsNextResult2.phase).toBe(newPhase);
    expect(whatsNextResult2.phase).not.toBe(initialPhase);
  });

  it('should maintain phase state across multiple transitions', async () => {
    // Start development
    const startResult = (await server.handleStartDevelopment({
      workflow: 'waterfall',
      commit_behaviour: 'none',
      require_reviews: false,
    })) as StartDevelopmentResult;

    expect(startResult.phase).toBe('requirements');

    // First transition
    await server.handleProceedToPhase({
      target_phase: 'design',
      reason: 'Requirements complete',
      review_state: 'not-required',
    });

    const afterDesign = (await server.handleWhatsNext({
      context: 'After design transition',
      user_input: 'Continuing',
    })) as WhatsNextResult;

    expect(afterDesign.phase).toBe('design');

    // Second transition
    await server.handleProceedToPhase({
      target_phase: 'implementation',
      reason: 'Design complete',
      review_state: 'not-required',
    });

    const afterImplementation = (await server.handleWhatsNext({
      context: 'After implementation transition',
      user_input: 'Continuing',
    })) as WhatsNextResult;

    expect(afterImplementation.phase).toBe('implementation');
    expect(afterImplementation.phase).not.toBe('design');
    expect(afterImplementation.phase).not.toBe('requirements');
  });
});
