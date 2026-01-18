import { describe, it, expect, beforeEach } from 'vitest';
import { InstructionGenerator } from '../../src/instruction-generator';
import { PlanManager } from '../../src/plan-manager';
import type { InstructionContext } from '../../src/instruction-generator';
import type { TaskBackendConfig } from '../../src/task-backend';
import type { ConversationContext } from '../../src/types';

describe('Markdown Backend Protection Tests', () => {
  let instructionGenerator: InstructionGenerator;
  let mockPlanManager: PlanManager;
  let mockInstructionContext: InstructionContext;
  let mockConversationContext: ConversationContext;

  beforeEach(() => {
    // Mock PlanManager
    mockPlanManager = {} as PlanManager;

    // Mock markdown backend detector (always returns markdown)
    const markdownBackendDetector = (): TaskBackendConfig => ({
      backend: 'markdown',
      isAvailable: true,
    });

    instructionGenerator = new InstructionGenerator(
      mockPlanManager,
      markdownBackendDetector
    );

    // Set up mock contexts
    mockConversationContext = {
      conversationId: 'test-conversation',
      projectPath: '/test/project',
      planFilePath: '/test/project/.vibe/plan.md',
      gitBranch: 'main',
      currentPhase: 'design',
      workflowName: 'epcc',
    };

    mockInstructionContext = {
      phase: 'design',
      conversationContext: mockConversationContext,
      transitionReason: 'test',
      isModeled: false,
      planFileExists: true,
    };
  });

  describe('Complete Markdown Structure Validation', () => {
    it('should generate complete markdown backend instruction structure', async () => {
      const result = await instructionGenerator.generateInstructions(
        'Work on design tasks.',
        mockInstructionContext
      );

      // Verify ALL markdown-specific elements are present
      expect(result.instructions).toContain('Check your plan file at');
      expect(result.instructions).toContain('**Plan File Guidance:**');
      expect(result.instructions).toContain(
        'Work on the tasks listed in the Design section'
      );
      expect(result.instructions).toContain(
        'Mark completed tasks with [x] as you finish them'
      );
      expect(result.instructions).toContain(
        'Add new tasks as they are identified during your work with the user'
      );
      expect(result.instructions).toContain(
        'Update the "Key Decisions" section with important choices made'
      );
      expect(result.instructions).toContain(
        'Add relevant notes to help maintain context'
      );
      expect(result.instructions).toContain('**Project Context:**');
      expect(result.instructions).toContain('**Important Reminders:**');
      expect(result.instructions).toContain(
        'Use ONLY the development plan for task management'
      );

      // Should NOT contain ANY beads-specific content
      expect(result.instructions).not.toContain('bd CLI');
      expect(result.instructions).not.toContain('hierarchical task structure');
      expect(result.instructions).not.toContain(
        'Project Epic → Phase Tasks → Work Items'
      );
      expect(result.instructions).not.toContain('--parent flag');
      expect(result.instructions).not.toContain('bd create');
      expect(result.instructions).not.toContain('bd list');
      expect(result.instructions).not.toContain('bd ready');
    });

    it('should include correct plan file path in markdown instructions', async () => {
      const customPlanPath = '/custom/project/.vibe/custom-plan.md';
      const customContext = {
        ...mockInstructionContext,
        conversationContext: {
          ...mockConversationContext,
          planFilePath: customPlanPath,
        },
      };

      const result = await instructionGenerator.generateInstructions(
        'Test instructions',
        customContext
      );

      expect(result.instructions).toContain(
        `Check your plan file at \`${customPlanPath}\``
      );
    });

    it('should customize markdown guidance based on phase', async () => {
      // Test design phase
      const designResult = await instructionGenerator.generateInstructions(
        'Design phase instructions',
        { ...mockInstructionContext, phase: 'design' }
      );

      expect(designResult.instructions).toContain(
        'focus on the "Design" section'
      );
      expect(designResult.instructions).toContain(
        'Work on the tasks listed in the Design section'
      );

      // Test implementation phase
      const implResult = await instructionGenerator.generateInstructions(
        'Implementation phase instructions',
        { ...mockInstructionContext, phase: 'implementation' }
      );

      expect(implResult.instructions).toContain(
        'focus on the "Implementation" section'
      );
      expect(implResult.instructions).toContain(
        'Work on the tasks listed in the Implementation section'
      );
    });
  });

  describe('Anti-Contamination Protection', () => {
    it('should never include beads instructions in markdown mode', async () => {
      const result = await instructionGenerator.generateInstructions(
        'Test instructions',
        mockInstructionContext
      );

      // Explicitly verify NO beads content - comprehensive list
      const beadsTerms = [
        'bd CLI',
        'bd create',
        'bd list',
        'bd ready',
        'bd update',
        'bd show',
        '--parent flag',
        '--parent',
        'hierarchical task structure',
        'Project Epic → Phase Tasks → Work Items',
        'BD CLI TASK SYSTEM',
        'Essential Commands',
        'Work Items',
        'Phase Tasks',
        'Project Epic',
        'ready work items',
        'create work item',
        'beads',
        'BEADS',
      ];

      for (const term of beadsTerms) {
        expect(
          result.instructions,
          `Should not contain beads term: "${term}"`
        ).not.toContain(term);
      }
    });

    it('should never lose plan file references in markdown mode', async () => {
      const result = await instructionGenerator.generateInstructions(
        'Test instructions',
        mockInstructionContext
      );

      // These MUST be present in markdown mode
      expect(result.instructions).toContain('Check your plan file');
      expect(result.instructions).toContain('**Plan File Guidance:**');
      expect(result.instructions).toContain(
        mockConversationContext.planFilePath
      );
    });

    it('should provide only markdown task management guidance', async () => {
      const result = await instructionGenerator.generateInstructions(
        'Test instructions',
        mockInstructionContext
      );

      // Verify markdown-specific task guidance
      expect(result.instructions).toContain(
        'Mark completed tasks with [x] as you finish them'
      );
      expect(result.instructions).toContain(
        'Use ONLY the development plan for task management'
      );

      // Verify NO beads task guidance
      expect(result.instructions).not.toContain('Use bd CLI tool exclusively');
      expect(result.instructions).not.toContain(
        'Use ONLY bd CLI tool for task management'
      );
      expect(result.instructions).not.toContain('Create new task under phase');
    });
  });

  describe('Plan File Integration', () => {
    it('should handle non-existent plan file in markdown mode', async () => {
      const contextNoPlan = {
        ...mockInstructionContext,
        planFileExists: false,
      };

      const result = await instructionGenerator.generateInstructions(
        'Test instructions',
        contextNoPlan
      );

      // Should still reference plan file even if it doesn't exist
      expect(result.instructions).toContain('Check your plan file');
      expect(result.instructions).toContain(
        'Plan file will be created when you first update it'
      );
    });

    it('should maintain markdown structure regardless of backend availability', async () => {
      // Even if beads backend changes state, markdown mode should be consistent
      const result = await instructionGenerator.generateInstructions(
        'Test instructions with backend variations',
        mockInstructionContext
      );

      // Core markdown structure should always be present
      expect(result.instructions).toContain('Check your plan file at');
      expect(result.instructions).toContain('**Plan File Guidance:**');
      expect(result.instructions).toContain('Work on the tasks listed in');
      expect(result.instructions).toContain('**Project Context:**');
    });
  });

  describe('Variable Substitution in Markdown Context', () => {
    it('should properly substitute variables in markdown mode', async () => {
      const instructionsWithVariables =
        'Review the design in $DESIGN_DOC and implement according to $ARCHITECTURE_DOC.';

      const result = await instructionGenerator.generateInstructions(
        instructionsWithVariables,
        mockInstructionContext
      );

      // Should contain substituted paths
      expect(result.instructions).toContain(
        '/test/project/.vibe/docs/design.md'
      );
      expect(result.instructions).toContain(
        '/test/project/.vibe/docs/architecture.md'
      );

      // Should still be in markdown format
      expect(result.instructions).toContain('Check your plan file');
      expect(result.instructions).not.toContain('bd CLI');
    });
  });

  describe('Markdown Mode Consistency', () => {
    it('should provide consistent markdown instructions across different phases', async () => {
      const phases = ['explore', 'plan', 'code', 'commit'];

      for (const phase of phases) {
        const context = { ...mockInstructionContext, phase };
        const result = await instructionGenerator.generateInstructions(
          `${phase} instructions`,
          context
        );

        // All phases should have consistent markdown structure
        expect(
          result.instructions,
          `Phase ${phase} should have plan file reference`
        ).toContain('Check your plan file');
        expect(
          result.instructions,
          `Phase ${phase} should have markdown guidance`
        ).toContain('Mark completed tasks with [x]');
        expect(
          result.instructions,
          `Phase ${phase} should not have beads content`
        ).not.toContain('bd CLI');
      }
    });

    it('should never accidentally switch to beads mode in markdown backend', async () => {
      // Multiple instruction generations should be consistent
      const results = await Promise.all([
        instructionGenerator.generateInstructions(
          'Test 1',
          mockInstructionContext
        ),
        instructionGenerator.generateInstructions(
          'Test 2',
          mockInstructionContext
        ),
        instructionGenerator.generateInstructions(
          'Test 3',
          mockInstructionContext
        ),
      ]);

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        expect(
          result.instructions,
          `Result ${index + 1} should be markdown mode`
        ).toContain('Check your plan file');
        expect(
          result.instructions,
          `Result ${index + 1} should not have beads content`
        ).not.toContain('bd CLI');
      }
    });

    it('should handle stressful instruction generation patterns without mode switching', async () => {
      // Simulate sequential instruction generation that might trigger race conditions
      for (let i = 0; i < 5; i++) {
        const result = await instructionGenerator.generateInstructions(
          `Sequential test ${i}`,
          mockInstructionContext
        );

        expect(
          result.instructions,
          `Sequential result ${i + 1} should be markdown mode`
        ).toContain('Check your plan file');
        expect(
          result.instructions,
          `Sequential result ${i + 1} should not have beads content`
        ).not.toContain('bd CLI');
      }
    });

    it('should maintain markdown backend protection even with beads-like instruction content', async () => {
      // Test with instructions that contain beads-like content to ensure it doesn't trigger beads mode
      const trickInstructions =
        'Create a task database with bd-style commands and beads integration patterns.';

      const result = await instructionGenerator.generateInstructions(
        trickInstructions,
        mockInstructionContext
      );

      // Should still be markdown mode despite beads-like content in instructions
      expect(result.instructions).toContain('Check your plan file');
      expect(result.instructions).toContain('Mark completed tasks with [x]');
      expect(result.instructions).not.toContain('bd CLI');

      // Original instructions should be preserved
      expect(result.instructions).toContain(trickInstructions);
    });

    it('should handle long complex instructions without corruption', async () => {
      const longInstructions = `
        This is a very long set of instructions that includes multiple paragraphs,
        complex formatting, and various edge cases that might trigger unexpected
        behavior in the instruction generation system. We need to ensure that
        even with complex inputs, the markdown backend protection remains active.

        ## Complex Requirements
        - Implement database schemas with bd prefixes
        - Create beads-like configuration systems
        - Build task management interfaces
        - Design hierarchical data structures

        The system should remain in markdown mode regardless of these requirements.
      `.trim();

      const result = await instructionGenerator.generateInstructions(
        longInstructions,
        mockInstructionContext
      );

      // Core markdown structure should be preserved
      expect(result.instructions).toContain('Check your plan file');
      expect(result.instructions).toContain('**Plan File Guidance:**');
      expect(result.instructions).toContain('Mark completed tasks with [x]');

      // Should not contain beads mode elements
      expect(result.instructions).not.toContain('bd CLI');
      expect(result.instructions).not.toContain('Use bd CLI tool exclusively');
    });
  });
});
