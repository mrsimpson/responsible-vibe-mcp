/**
 * Unit tests for InstructionGenerator Core Functionality
 *
 * Tests the core InstructionGenerator class behavior.
 * Backend selection is now handled by the ServerComponentsFactory in the mcp-server package.
 * This test validates that the core InstructionGenerator produces consistent markdown-based instructions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstructionGenerator } from '../../src/instruction-generator.js';
import type { ConversationContext } from '../../src/types.js';
import type { InstructionContext } from '../../src/interfaces/instruction-generator.interface.js';
import type { ProjectDocsManager } from '../../src/project-docs-manager.js';
import { PlanManager } from '../../src/plan-manager.js';
import { TestAccess } from '../utils/test-access.js';
import { join } from 'node:path';

// Mock ProjectDocsManager
vi.mock('../../src/project-docs-manager.js');

describe('InstructionGenerator - Core Functionality', () => {
  let instructionGenerator: InstructionGenerator;
  let mockProjectDocsManager: Partial<ProjectDocsManager>;
  let testProjectPath: string;
  let mockConversationContext: ConversationContext;
  let mockInstructionContext: InstructionContext;

  beforeEach(() => {
    testProjectPath = '/test/project';

    // Mock ProjectDocsManager
    mockProjectDocsManager = {
      getVariableSubstitutions: vi.fn().mockReturnValue({
        $DESIGN_DOC: join(testProjectPath, '.vibe', 'docs', 'design.md'),
      }),
    };

    // Create instruction generator
    const mockPlanManager = {} as unknown as PlanManager;
    instructionGenerator = new InstructionGenerator(mockPlanManager);
    TestAccess.injectMock(
      instructionGenerator,
      'projectDocsManager',
      mockProjectDocsManager
    );

    // Mock conversation context
    mockConversationContext = {
      projectPath: testProjectPath,
      planFilePath: join(testProjectPath, '.vibe', 'plan.md'),
      gitBranch: 'main',
      conversationId: 'test-conversation',
    } as ConversationContext;

    // Mock instruction context
    mockInstructionContext = {
      phase: 'design',
      conversationContext: mockConversationContext,
      transitionReason: 'Test transition',
      isModeled: false,
      planFileExists: true,
    };
  });

  it('should provide markdown task guidance consistently', async () => {
    const baseInstructions = 'Work on design tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    // Core InstructionGenerator always produces markdown-style instructions
    expect(result.instructions).toContain('Mark completed tasks with [x]');
    expect(result.instructions).toContain(
      'Use ONLY the development plan for task management'
    );
    expect(result.instructions).toContain('Check your plan file');
    expect(result.instructions).toContain('**Plan File Guidance:**');
    expect(result.instructions).toContain('**Important Reminders:**');
  });

  it('should not contain beads-specific instructions', async () => {
    const baseInstructions = 'Work on design tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    // Core InstructionGenerator should not produce beads-specific content
    expect(result.instructions).not.toContain('bd create');
    expect(result.instructions).not.toContain('bd CLI tool');
    expect(result.instructions).not.toContain('beads');
    expect(result.instructions).not.toContain('bd');
  });

  it('should handle variable substitution correctly', async () => {
    const baseInstructions =
      'Review the design in $DESIGN_DOC and complete the tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain('/test/project/.vibe/docs/design.md');
    expect(result.instructions).toContain('Mark completed tasks with [x]');
  });

  it('should provide consistent instruction structure', async () => {
    const baseInstructions = 'Test instructions';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    // Check for expected sections
    expect(result.instructions).toContain('Check your plan file');
    expect(result.instructions).toContain('**Plan File Guidance:**');
    expect(result.instructions).toContain('**Important Reminders:**');
  });

  it('should handle transition context when provided', async () => {
    const contextWithTransition = {
      ...mockInstructionContext,
      isModeled: true,
      transitionReason: 'All exploration tasks completed',
    };

    const result = await instructionGenerator.generateInstructions(
      'Continue with implementation.',
      contextWithTransition
    );

    expect(result.instructions).toContain('All exploration tasks completed');
  });

  it('should handle missing plan file scenario', async () => {
    const contextWithoutPlan = {
      ...mockInstructionContext,
      planFileExists: false,
    };

    const result = await instructionGenerator.generateInstructions(
      'Start working on tasks.',
      contextWithoutPlan
    );

    expect(result.instructions).toContain(
      'Plan file will be created when you first update it'
    );
  });
});
