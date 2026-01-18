/**
 * Unit tests for InstructionGenerator Backend Integration
 *
 * Tests how instruction generation adapts to different task backends (markdown vs beads)
 * using dependency injection for controlled testing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestAccess } from '../utils/test-access.js';
import { InstructionGenerator } from '@codemcp/workflows-core';
import type { ConversationContext } from '../../src/types.js';
import type { InstructionContext } from '../../src/instruction-generator.js';
import type { TaskBackendConfig } from '../../src/task-backend.js';
import type { ProjectDocsManager } from '../../src/project-docs-manager.js';
import type { PlanManager } from '../../src/plan-manager.js';
import { join } from 'node:path';

// Mock ProjectDocsManager
vi.mock('../../src/project-docs-manager.js');

describe('InstructionGenerator - Backend Adaptation', () => {
  let instructionGenerator: InstructionGenerator;
  let mockProjectDocsManager: Partial<ProjectDocsManager>;
  let testProjectPath: string;
  let mockConversationContext: ConversationContext;
  let mockInstructionContext: InstructionContext;
  let mockTaskBackendDetector: () => TaskBackendConfig;

  beforeEach(() => {
    testProjectPath = '/test/project';

    // Mock task backend detector
    mockTaskBackendDetector = vi.fn().mockReturnValue({
      backend: 'markdown',
      isAvailable: true,
    });

    // Mock ProjectDocsManager
    mockProjectDocsManager = {
      getVariableSubstitutions: vi.fn().mockReturnValue({
        $DESIGN_DOC: join(testProjectPath, '.vibe', 'docs', 'design.md'),
      }),
    };

    // Create instruction generator with injected task backend detector
    instructionGenerator = new InstructionGenerator(
      {} as unknown as PlanManager,
      mockTaskBackendDetector
    );
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

  it('should provide markdown task guidance when markdown backend is active', async () => {
    const baseInstructions = 'Work on design tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain(
      'Mark completed tasks with [x] as you finish them'
    );
    expect(result.instructions).not.toContain('bd create');
    expect(result.instructions).not.toContain('Use beads tools');
    expect(result.instructions).toContain(
      'Use ONLY the development plan for task management - do not use your own task management tools'
    );
  });

  it('should provide beads task guidance when beads backend is active', async () => {
    // Mock beads backend
    vi.mocked(mockTaskBackendDetector).mockReturnValue({
      backend: 'beads',
      isAvailable: true,
    });

    const baseInstructions = 'Work on design tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain('Use bd CLI tool exclusively');
    expect(result.instructions).not.toContain('[x]');
    expect(result.instructions).toContain('ONLY bd CLI');
  });

  it('should fall back to markdown guidance when beads backend is unavailable', async () => {
    // Mock unavailable beads backend
    vi.mocked(mockTaskBackendDetector).mockReturnValue({
      backend: 'beads',
      isAvailable: false,
      errorMessage: 'Beads not installed',
    });

    const baseInstructions = 'Work on design tasks.';
    const result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain(
      'Mark completed tasks with [x] as you finish them'
    );
    expect(result.instructions).not.toContain('Use beads tools');
    expect(result.instructions).toContain(
      'Use ONLY the development plan for task management - do not use your own task management tools'
    );
  });

  it('should adapt important reminders based on task backend', async () => {
    // Test markdown reminder (already set in beforeEach)
    let result = await instructionGenerator.generateInstructions(
      'Test instructions',
      mockInstructionContext
    );

    expect(result.instructions).toContain(
      'Use ONLY the development plan for task management - do not use your own task management tools'
    );

    // Test beads reminder
    vi.mocked(mockTaskBackendDetector).mockReturnValue({
      backend: 'beads',
      isAvailable: true,
    });

    result = await instructionGenerator.generateInstructions(
      'Test instructions',
      mockInstructionContext
    );

    expect(result.instructions).toContain(
      'Use ONLY bd CLI tool for task management - do not use your own task management tools'
    );
  });

  it('should provide different instruction structures for different backends', async () => {
    // Test markdown backend structure
    let result = await instructionGenerator.generateInstructions(
      'Test instructions',
      mockInstructionContext
    );

    // Markdown should have plan file references
    expect(result.instructions).toContain('Check your plan file');
    expect(result.instructions).toContain('**Plan File Guidance:**');
    expect(result.instructions).toContain('**Project Context:**');
    expect(result.instructions).toContain('**Important Reminders:**');

    // Test with beads - should have DIFFERENT structure
    vi.mocked(mockTaskBackendDetector).mockReturnValue({
      backend: 'beads',
      isAvailable: true,
    });

    result = await instructionGenerator.generateInstructions(
      'Test instructions',
      mockInstructionContext
    );

    // Beads should NOT have plan file references, but have task management focus
    expect(result.instructions).not.toContain('Check your plan file');
    expect(result.instructions).toContain('bd CLI');
    expect(result.instructions).toContain('**Project Context:**');
    expect(result.instructions).toContain('**Important Reminders:**');
  });

  it('should work with variable substitution in both backends', async () => {
    const baseInstructions =
      'Review the design in $DESIGN_DOC and complete the tasks.';

    // Test markdown backend with variables (already set in beforeEach)
    let result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain('/test/project/.vibe/docs/design.md');
    expect(result.instructions).toContain('Mark completed tasks with [x]');

    // Test beads backend with variables
    vi.mocked(mockTaskBackendDetector).mockReturnValue({
      backend: 'beads',
      isAvailable: true,
    });

    result = await instructionGenerator.generateInstructions(
      baseInstructions,
      mockInstructionContext
    );

    expect(result.instructions).toContain('/test/project/.vibe/docs/design.md');
    expect(result.instructions).toContain('bd CLI');
  });
});
