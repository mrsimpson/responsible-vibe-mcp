/**
 * BeadsInstructionGenerator Content Validation Tests
 *
 * Tests for validating that BeadsInstructionGenerator generates the correct
 * beads-specific instruction content and does not contain markdown-specific content.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BeadsInstructionGenerator } from '../../src/components/beads/beads-instruction-generator.js';
import type {
  InstructionContext,
  ConversationContext,
} from '@codemcp/workflows-core';

describe('BeadsInstructionGenerator Content Validation', () => {
  let beadsInstructionGenerator: BeadsInstructionGenerator;
  let mockInstructionContext: InstructionContext;
  let mockConversationContext: ConversationContext;

  beforeEach(() => {
    beadsInstructionGenerator = new BeadsInstructionGenerator();

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
      transitionReason: 'test transition',
      isModeled: false,
      planFileExists: true,
    };
  });

  describe('Beads-Specific Content Must Be Present', () => {
    it('should generate complete beads task management header structure', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design tasks.',
        mockInstructionContext
      );

      // Verify ALL beads-specific elements are present
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
    });

    it('should contain core beads CLI commands with proper formatting', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Verify specific beads CLI commands are present
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
      expect(result.instructions).toContain(
        "bd create 'Task title' --parent <phase-task-id> -p <priority>"
      );
      expect(result.instructions).toContain(
        'bd update <task-id> --status in_progress'
      );
      expect(result.instructions).toContain('bd close <task-id>');
    });

    it('should contain beads-specific task management prohibition', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Verify beads-specific prohibition
      expect(result.instructions).toContain(
        'Do NOT enter tasks in the plan file, use beads CLI exclusively'
      );
    });

    it('should contain beads-specific reminders section', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Verify beads-specific reminders
      expect(result.instructions).toContain(
        'Use ONLY bd CLI tool for task management - do not use your own task management tools'
      );
      expect(result.instructions).toContain(
        'Call whats_next() after the next user message to maintain the development workflow'
      );
    });

    it('should contain beads plan file guidance', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Verify beads-specific plan file guidance
      expect(result.planFileGuidance).toContain(
        'Using beads CLI for task management - plan file serves as context only'
      );
    });

    it('should use proper beads terminology and structure', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Verify beads terminology
      expect(result.instructions).toContain('ready tasks');
      expect(result.instructions).toContain('phase-task-id');
      expect(result.instructions).toContain('Current Phase:');
    });
  });

  describe('Anti-Contamination (Should NOT contain markdown-specific content)', () => {
    it('should never contain markdown task management instructions', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Should NOT contain markdown-specific content
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
      expect(result.instructions).not.toContain(
        'Use ONLY the development plan for task management'
      );
      expect(result.instructions).not.toContain(
        'Work on the tasks listed in the Design section'
      );
    });

    it('should never contain markdown plan file task instructions', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Should NOT contain markdown plan file task management
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x] as you finish them'
      );
      expect(result.instructions).not.toContain(
        'focus on the "Design" section'
      );
      expect(result.instructions).not.toContain(
        'focus on the "Design" section'
      );
    });

    it('should not include markdown-style task format examples', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        mockInstructionContext
      );

      // Should NOT contain markdown task formatting
      expect(result.instructions).not.toContain('- [ ]');
      expect(result.instructions).not.toContain('- [x]');
      expect(result.instructions).not.toContain('Check your plan file at');
    });

    it('should provide exclusive beads guidance without markdown contamination', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Complex task management scenario',
        mockInstructionContext
      );

      // Comprehensive check against markdown contamination
      const markdownTerms = [
        'Mark completed tasks with [x]',
        'Use ONLY the development plan for task management',
        'Work on the tasks listed in',
        'focus on the "Design" section',
        'Mark completed tasks with [x] as you finish them',
        'Check your plan file at',
        '- [ ]',
        '- [x]',
      ];

      for (const term of markdownTerms) {
        expect(
          result.instructions,
          `Should not contain markdown term: "${term}"`
        ).not.toContain(term);
      }
    });
  });

  describe('Phase-Specific Content Validation', () => {
    it('should generate phase-specific beads instructions for different phases', async () => {
      const phases = ['explore', 'plan', 'code', 'commit'];

      for (const phase of phases) {
        const context = { ...mockInstructionContext, phase };
        const result = await beadsInstructionGenerator.generateInstructions(
          `${phase} instructions`,
          context
        );

        // All phases should have consistent beads structure
        expect(
          result.instructions,
          `Phase ${phase} should have BD CLI header`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Phase ${phase} should have beads CLI commands`
        ).toContain('bd list --parent');
        expect(
          result.instructions,
          `Phase ${phase} should not have markdown content`
        ).not.toContain('Mark completed tasks with [x]');

        // Should reference the correct phase
        expect(result.instructions).toContain(`Current Phase: ${phase}`);
      }
    });

    it('should customize beads guidance based on phase context', async () => {
      // Test design phase
      const designResult = await beadsInstructionGenerator.generateInstructions(
        'Design phase instructions',
        { ...mockInstructionContext, phase: 'design' }
      );

      expect(designResult.instructions).toContain(
        'You are in the design phase'
      );

      // Test implementation phase
      const implResult = await beadsInstructionGenerator.generateInstructions(
        'Implementation phase instructions',
        { ...mockInstructionContext, phase: 'implementation' }
      );

      expect(implResult.instructions).toContain(
        'You are in the implementation phase'
      );
    });
  });

  describe('Variable Substitution in Beads Context', () => {
    it('should properly substitute variables while maintaining beads structure', async () => {
      const instructionsWithVariables =
        'Review the design in $DESIGN_DOC and implement according to $ARCHITECTURE_DOC.';

      const result = await beadsInstructionGenerator.generateInstructions(
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

      // Should still be in beads format
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
    });

    it('should handle multiple variable occurrences in beads context', async () => {
      const baseInstructions =
        'Check $DESIGN_DOC for details. Update $DESIGN_DOC with new information.';

      const result = await beadsInstructionGenerator.generateInstructions(
        baseInstructions,
        mockInstructionContext
      );

      const designDocPath = '/test/project/.vibe/docs/design.md';
      const occurrences = (
        result.instructions.match(
          new RegExp(designDocPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        ) || []
      ).length;
      expect(occurrences).toBe(2);
      expect(result.instructions).not.toContain('$DESIGN_DOC');

      // Still beads format
      expect(result.instructions).toContain('bd CLI tool exclusively');
    });
  });

  describe('Plan File Handling in Beads Mode', () => {
    it('should handle non-existent plan file in beads mode', async () => {
      const contextNoPlan = {
        ...mockInstructionContext,
        planFileExists: false,
      };

      const result = await beadsInstructionGenerator.generateInstructions(
        'Test instructions',
        contextNoPlan
      );

      // Should still use beads structure
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain(
        'Plan file will be created when you first update it'
      );

      // Should not revert to markdown mode
      expect(result.instructions).not.toContain('Check your plan file at');
    });

    it('should maintain beads structure regardless of plan file state', async () => {
      const contextWithPlan = {
        ...mockInstructionContext,
        planFileExists: true,
      };
      const contextWithoutPlan = {
        ...mockInstructionContext,
        planFileExists: false,
      };

      const resultWithPlan =
        await beadsInstructionGenerator.generateInstructions(
          'Test instructions with plan',
          contextWithPlan
        );

      const resultWithoutPlan =
        await beadsInstructionGenerator.generateInstructions(
          'Test instructions without plan',
          contextWithoutPlan
        );

      // Both should have beads structure
      expect(resultWithPlan.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );
      expect(resultWithoutPlan.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );

      // Neither should have markdown structure
      expect(resultWithPlan.instructions).not.toContain(
        'Check your plan file at'
      );
      expect(resultWithoutPlan.instructions).not.toContain(
        'Check your plan file at'
      );
    });
  });

  describe('Beads Mode Consistency', () => {
    it('should provide consistent beads instructions across multiple generations', async () => {
      // Multiple instruction generations should be consistent
      const results = await Promise.all([
        beadsInstructionGenerator.generateInstructions(
          'Test 1',
          mockInstructionContext
        ),
        beadsInstructionGenerator.generateInstructions(
          'Test 2',
          mockInstructionContext
        ),
        beadsInstructionGenerator.generateInstructions(
          'Test 3',
          mockInstructionContext
        ),
      ]);

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        expect(
          result.instructions,
          `Result ${index + 1} should be beads mode`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Result ${index + 1} should not have markdown content`
        ).not.toContain('Mark completed tasks with [x]');
      }
    });

    it('should never accidentally switch to markdown mode in beads backend', async () => {
      // Simulate sequential instruction generation
      for (let i = 0; i < 5; i++) {
        const result = await beadsInstructionGenerator.generateInstructions(
          `Sequential test ${i}`,
          mockInstructionContext
        );

        expect(
          result.instructions,
          `Sequential result ${i + 1} should be beads mode`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Sequential result ${i + 1} should not have markdown content`
        ).not.toContain('Check your plan file at');
      }
    });

    it('should maintain beads backend protection even with markdown-like instruction content', async () => {
      // Test with instructions that contain markdown-like content
      const trickInstructions =
        'Create a plan file with [x] checkboxes and markdown task management.';

      const result = await beadsInstructionGenerator.generateInstructions(
        trickInstructions,
        mockInstructionContext
      );

      // Should still be beads mode despite markdown-like content in instructions
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );

      // Original instructions should be preserved
      expect(result.instructions).toContain(trickInstructions);
    });

    it('should handle long complex instructions without corruption', async () => {
      const longInstructions = `
        This is a very long set of instructions that includes multiple paragraphs,
        complex formatting, and various edge cases that might trigger unexpected
        behavior in the instruction generation system. We need to ensure that
        even with complex inputs, the beads backend protection remains active.

        ## Complex Requirements
        - Implement markdown-style task lists
        - Create plan file management systems
        - Build [x] checkbox interfaces
        - Design traditional task tracking

        The system should remain in beads mode regardless of these requirements.
      `.trim();

      const result = await beadsInstructionGenerator.generateInstructions(
        longInstructions,
        mockInstructionContext
      );

      // Core beads structure should be preserved
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).toContain('bd list --parent');

      // Should not contain markdown mode elements
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
      expect(result.instructions).not.toContain('Check your plan file at');
    });
  });

  describe('Metadata Validation', () => {
    it('should return correct metadata in beads mode', async () => {
      const result = await beadsInstructionGenerator.generateInstructions(
        'Test instructions',
        mockInstructionContext
      );

      expect(result.metadata).toEqual({
        phase: 'design',
        planFilePath: '/test/project/.vibe/plan.md',
        transitionReason: 'test transition',
        isModeled: false,
      });

      // Plan file guidance should be beads-specific
      expect(result.planFileGuidance).toContain(
        'beads CLI for task management'
      );
      expect(result.planFileGuidance).not.toContain('markdown');
    });

    it('should handle modeled vs non-modeled transitions in beads mode', async () => {
      // Test modeled transition
      const modeledContext: InstructionContext = {
        ...mockInstructionContext,
        isModeled: true,
        transitionReason: 'Model-driven transition',
      };

      const modeledResult =
        await beadsInstructionGenerator.generateInstructions(
          'Modeled instructions',
          modeledContext
        );

      expect(modeledResult.metadata.isModeled).toBe(true);
      expect(modeledResult.instructions).toContain('Model-driven transition');
      expect(modeledResult.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );

      // Test non-modeled transition
      const nonModeledContext: InstructionContext = {
        ...mockInstructionContext,
        isModeled: false,
        transitionReason: 'Manual transition',
      };

      const nonModeledResult =
        await beadsInstructionGenerator.generateInstructions(
          'Manual instructions',
          nonModeledContext
        );

      expect(nonModeledResult.metadata.isModeled).toBe(false);
      expect(nonModeledResult.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );
    });
  });

  describe('Sequential Generation Consistency', () => {
    it('should never accidentally switch to markdown mode in beads backend during sequential generation', async () => {
      // Multiple instruction generations should be consistent - matching markdown test pattern
      const results = await Promise.all([
        beadsInstructionGenerator.generateInstructions(
          'Test 1',
          mockInstructionContext
        ),
        beadsInstructionGenerator.generateInstructions(
          'Test 2',
          mockInstructionContext
        ),
        beadsInstructionGenerator.generateInstructions(
          'Test 3',
          mockInstructionContext
        ),
      ]);

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        expect(
          result.instructions,
          `Result ${index + 1} should be beads mode`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Result ${index + 1} should not have markdown content`
        ).not.toContain('Mark completed tasks with [x]');
      }
    });

    it('should handle stressful instruction generation patterns without mode switching', async () => {
      // Simulate sequential instruction generation that might trigger race conditions
      for (let i = 0; i < 5; i++) {
        const result = await beadsInstructionGenerator.generateInstructions(
          `Sequential test ${i}`,
          mockInstructionContext
        );

        expect(
          result.instructions,
          `Sequential result ${i + 1} should be beads mode`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Sequential result ${i + 1} should not have markdown content`
        ).not.toContain('Mark completed tasks with [x]');
      }
    });
  });

  describe('Stress Testing and Race Conditions', () => {
    it('should handle rapid concurrent instruction generation without corruption', async () => {
      // Stress test for race conditions - matching markdown test coverage
      const concurrentPromises = Array.from({ length: 10 }, (_, i) =>
        beadsInstructionGenerator.generateInstructions(
          `Concurrent test ${i}`,
          mockInstructionContext
        )
      );

      const results = await Promise.all(concurrentPromises);

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        expect(
          result.instructions,
          `Concurrent result ${index + 1} should be beads mode`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Concurrent result ${index + 1} should have beads CLI commands`
        ).toContain('Use bd CLI tool exclusively');
        expect(
          result.instructions,
          `Concurrent result ${index + 1} should not have markdown contamination`
        ).not.toContain('Check your plan file at');
      }
    });

    it('should maintain beads structure under memory pressure conditions', async () => {
      // Create large instruction content to test memory handling
      const largeInstructions = Array.from(
        { length: 1000 },
        (_, i) =>
          `Instruction line ${i} with complex requirements and detailed specifications.`
      ).join('\n');

      const result = await beadsInstructionGenerator.generateInstructions(
        largeInstructions,
        mockInstructionContext
      );

      // Core beads structure should be preserved even with large content
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).toContain('bd list --parent');

      // Should not contain markdown mode elements
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
      expect(result.instructions).not.toContain('Check your plan file at');
    });
  });

  describe('Complex Instruction Handling', () => {
    it('should handle deeply nested instruction structures without corruption', async () => {
      const complexInstructions = `
        ## Primary Objective
        Complete the following complex multi-layered tasks:

        ### Layer 1: Analysis
        - Analyze existing markdown-based systems
        - Review plan file management approaches
        - Document [x] checkbox patterns

        ### Layer 2: Implementation
        - Implement beads CLI integration
        - Create hierarchical task structures
        - Build robust error handling

        ### Layer 3: Validation
        - Test cross-backend compatibility
        - Verify anti-contamination measures
        - Validate task management isolation

        All work must maintain strict backend separation.
      `.trim();

      const result = await beadsInstructionGenerator.generateInstructions(
        complexInstructions,
        mockInstructionContext
      );

      // Core beads structure should be preserved
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).toContain('bd list --parent');

      // Should not contain markdown mode elements despite markdown-like content
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
      expect(result.instructions).not.toContain('Check your plan file at');
      expect(result.instructions).not.toContain(
        'Use ONLY the development plan for task management'
      );

      // Original complex instructions should be preserved
      expect(result.instructions).toContain('Primary Objective');
      expect(result.instructions).toContain('Layer 1: Analysis');
    });

    it('should handle instructions with embedded beads and markdown terminology', async () => {
      const trickInstructions = `
        Create a new system that:
        - Uses markdown files for documentation
        - Implements [x] checkbox tracking
        - Has bd CLI-like commands but for different purposes
        - Manages plan files with markdown syntax
        - Creates beads-style hierarchical structures

        This should test anti-contamination thoroughly.
      `.trim();

      const result = await beadsInstructionGenerator.generateInstructions(
        trickInstructions,
        mockInstructionContext
      );

      // Should maintain beads mode despite confusing terminology
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );

      // Original instructions should be preserved
      expect(result.instructions).toContain('Create a new system that:');
    });
  });

  describe('Enhanced Plan File Integration', () => {
    it('should handle plan file creation guidance consistently', async () => {
      const contextNoPlan = {
        ...mockInstructionContext,
        planFileExists: false,
      };

      const result = await beadsInstructionGenerator.generateInstructions(
        'Start working with non-existent plan file',
        contextNoPlan
      );

      // Should provide creation guidance while maintaining beads structure
      expect(result.instructions).toContain(
        'Plan file will be created when you first update it'
      );
      expect(result.instructions).toContain('🔧 BD CLI Task Management:');
      expect(result.instructions).toContain('Use bd CLI tool exclusively');

      // Should not revert to markdown mode for missing files
      expect(result.instructions).not.toContain('Check your plan file at');
      expect(result.instructions).not.toContain(
        'Mark completed tasks with [x]'
      );
    });

    it('should maintain beads guidance regardless of plan file state changes', async () => {
      // Test with plan file existing
      const resultWithPlan =
        await beadsInstructionGenerator.generateInstructions(
          'Work with existing plan',
          { ...mockInstructionContext, planFileExists: true }
        );

      // Test with plan file missing
      const resultWithoutPlan =
        await beadsInstructionGenerator.generateInstructions(
          'Work without plan',
          { ...mockInstructionContext, planFileExists: false }
        );

      // Both should maintain beads structure
      expect(resultWithPlan.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );
      expect(resultWithoutPlan.instructions).toContain(
        '🔧 BD CLI Task Management:'
      );

      expect(resultWithPlan.instructions).toContain(
        'Use bd CLI tool exclusively'
      );
      expect(resultWithoutPlan.instructions).toContain(
        'Use bd CLI tool exclusively'
      );

      // Neither should have markdown contamination
      expect(resultWithPlan.instructions).not.toContain(
        'Check your plan file at'
      );
      expect(resultWithoutPlan.instructions).not.toContain(
        'Check your plan file at'
      );
    });
  });

  describe('Backend Availability and Robustness', () => {
    it('should maintain consistent beads structure regardless of external conditions', async () => {
      // Test multiple scenarios that might affect backend behavior
      const scenarios = [
        { name: 'basic', context: mockInstructionContext },
        {
          name: 'no-plan',
          context: { ...mockInstructionContext, planFileExists: false },
        },
        {
          name: 'modeled',
          context: { ...mockInstructionContext, isModeled: true },
        },
        {
          name: 'different-phase',
          context: { ...mockInstructionContext, phase: 'implementation' },
        },
      ];

      for (const scenario of scenarios) {
        const result = await beadsInstructionGenerator.generateInstructions(
          `Test scenario: ${scenario.name}`,
          scenario.context
        );

        expect(
          result.instructions,
          `Scenario ${scenario.name} should have beads structure`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Scenario ${scenario.name} should have beads CLI commands`
        ).toContain('Use bd CLI tool exclusively');
        expect(
          result.instructions,
          `Scenario ${scenario.name} should not have markdown contamination`
        ).not.toContain('Mark completed tasks with [x]');
      }
    });

    it('should handle edge case instruction patterns without degradation', async () => {
      const edgeCases = [
        '', // Empty instructions
        '.', // Minimal instructions
        Array.from({ length: 50 }, () => 'Repeat instruction content').join(
          ' '
        ), // Repetitive content
        '🔧 BD CLI Task Management: fake header', // Instructions containing beads-like headers
        'Check your plan file and mark tasks [x]', // Instructions with markdown terminology
      ];

      for (const edgeCase of edgeCases) {
        const result = await beadsInstructionGenerator.generateInstructions(
          edgeCase,
          mockInstructionContext
        );

        expect(
          result.instructions,
          `Edge case "${edgeCase.substring(0, 20)}..." should maintain beads structure`
        ).toContain('🔧 BD CLI Task Management:');
        expect(
          result.instructions,
          `Edge case "${edgeCase.substring(0, 20)}..." should not have markdown contamination`
        ).not.toContain('Check your plan file at');
      }
    });
  });
});
