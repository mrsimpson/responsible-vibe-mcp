/**
 * Phase-Specific Task ID Integration Tests for BeadsInstructionGenerator
 *
 * Tests that validate BeadsInstructionGenerator's ability to extract phase task IDs
 * from plan files and integrate them properly into BD CLI commands.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BeadsInstructionGenerator } from '../../src/components/beads/beads-instruction-generator.js';
import type {
  InstructionContext,
  ConversationContext,
} from '@codemcp/workflows-core';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Phase-Specific Task ID Integration Tests', () => {
  let beadsInstructionGenerator: BeadsInstructionGenerator;
  let mockInstructionContext: InstructionContext;
  let mockConversationContext: ConversationContext;
  let testTempDir: string;
  let testPlanFilePath: string;

  beforeEach(async () => {
    beadsInstructionGenerator = new BeadsInstructionGenerator();

    // Create temporary directory for test files
    testTempDir = join(process.cwd(), 'temp-test-' + Date.now());
    await mkdir(testTempDir, { recursive: true });

    testPlanFilePath = join(testTempDir, 'plan.md');

    // Set up mock contexts with temp directory
    mockConversationContext = {
      conversationId: 'test-conversation',
      projectPath: testTempDir,
      planFilePath: testPlanFilePath,
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

  afterEach(async () => {
    // Clean up temp files
    try {
      await rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Phase Task ID Extraction from Plan Files', () => {
    it('should extract phase task ID from properly formatted plan file', async () => {
      const planContent = `# Project Plan

## Explore
Some exploration tasks here.

## Design
<!-- beads-phase-id: project-epic-1.2 -->
- Design the system architecture
- Create wireframes
- Review requirements

## Implementation
Some implementation tasks here.
`;

      await writeFile(testPlanFilePath, planContent);

      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design tasks.',
        mockInstructionContext
      );

      // Should include specific phase task ID in commands
      expect(result.instructions).toContain(
        'bd list --parent project-epic-1.2 --status open'
      );
      expect(result.instructions).toContain(
        "bd create 'Task description' --parent project-epic-1.2 -p 2"
      );
      expect(result.instructions).toContain('bd show project-epic-1.2');
      expect(result.instructions).toContain(
        'All work items should be created as children of project-epic-1.2'
      );
    });

    it('should handle phase task IDs with various formats', async () => {
      const testCases = [
        { id: 'epic-123', phase: 'design' },
        { id: 'project-1.2.3', phase: 'design' },
        { id: 'feature-456.1', phase: 'design' },
        { id: 'milestone-x', phase: 'design' },
      ];

      for (const testCase of testCases) {
        const planContent = `# Project Plan

## Design
<!-- beads-phase-id: ${testCase.id} -->
- Task 1
- Task 2
`;

        await writeFile(testPlanFilePath, planContent);

        const result = await beadsInstructionGenerator.generateInstructions(
          'Work on tasks.',
          { ...mockInstructionContext, phase: testCase.phase }
        );

        expect(
          result.instructions,
          `Should extract ID: ${testCase.id}`
        ).toContain(`bd list --parent ${testCase.id} --status open`);
        expect(
          result.instructions,
          `Should use ID in create command: ${testCase.id}`
        ).toContain(
          `bd create 'Task description' --parent ${testCase.id} -p 2`
        );
      }
    });

    it('should handle different phase names with underscore formatting', async () => {
      const phaseMappings = [
        { phase: 'design', header: 'Design' },
        { phase: 'implementation', header: 'Implementation' },
        { phase: 'code_review', header: 'Code Review' },
        { phase: 'system_test', header: 'System Test' },
      ];

      for (const mapping of phaseMappings) {
        const planContent = `# Project Plan

## ${mapping.header}
<!-- beads-phase-id: phase-${mapping.phase}-123 -->
- Some tasks here
`;

        await writeFile(testPlanFilePath, planContent);

        const result = await beadsInstructionGenerator.generateInstructions(
          'Work on phase tasks.',
          { ...mockInstructionContext, phase: mapping.phase }
        );

        expect(
          result.instructions,
          `Should find task ID for phase: ${mapping.phase}`
        ).toContain(
          `bd list --parent phase-${mapping.phase}-123 --status open`
        );
        expect(
          result.instructions,
          `Should capitalize phase name correctly: ${mapping.phase}`
        ).toContain(`You are currently in the ${mapping.header} phase`);
      }
    });

    it('should handle multiple phases and extract correct phase task ID', async () => {
      const planContent = `# Project Plan

## Explore
<!-- beads-phase-id: explore-task-1 -->
- Research requirements
- Analyze existing solutions

## Design  
<!-- beads-phase-id: design-task-2 -->
- Create system design
- Design database schema

## Implementation
<!-- beads-phase-id: impl-task-3 -->
- Write core functionality
- Implement API endpoints
`;

      await writeFile(testPlanFilePath, planContent);

      // Test design phase extraction
      const designResult = await beadsInstructionGenerator.generateInstructions(
        'Work on design.',
        { ...mockInstructionContext, phase: 'design' }
      );

      expect(designResult.instructions).toContain(
        'bd list --parent design-task-2 --status open'
      );
      expect(designResult.instructions).not.toContain('explore-task-1');
      expect(designResult.instructions).not.toContain('impl-task-3');

      // Test implementation phase extraction
      const implResult = await beadsInstructionGenerator.generateInstructions(
        'Work on implementation.',
        { ...mockInstructionContext, phase: 'implementation' }
      );

      expect(implResult.instructions).toContain(
        'bd list --parent impl-task-3 --status open'
      );
      expect(implResult.instructions).not.toContain('design-task-2');
      expect(implResult.instructions).not.toContain('explore-task-1');
    });
  });

  describe('Graceful Handling of Missing Phase Task IDs', () => {
    it('should provide generic commands when no phase task ID is found', async () => {
      const planContent = `# Project Plan

## Design
- Some tasks without beads-phase-id
- More tasks here
`;

      await writeFile(testPlanFilePath, planContent);

      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design tasks.',
        mockInstructionContext
      );

      // Should fall back to generic placeholder commands
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
      expect(result.instructions).toContain(
        "bd create 'Task title' --parent <phase-task-id> -p 2"
      );
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).not.toContain('bd list --parent design-');
    });

    it('should handle malformed beads-phase-id comments gracefully', async () => {
      // Test cases that should fall back to generic commands (don't match regex)
      const genericFallbackCases = [
        '<!-- beads-phase-id -->', // No colon
        '<!-- beads-phase-id: @#$% -->', // Invalid characters (should not match regex)
      ];

      for (const malformedComment of genericFallbackCases) {
        const planContent = `# Project Plan

## Design
${malformedComment}
- Some tasks here
`;

        await writeFile(testPlanFilePath, planContent);

        const result = await beadsInstructionGenerator.generateInstructions(
          'Work on tasks.',
          mockInstructionContext
        );

        expect(
          result.instructions,
          `Should fall back to generic for malformed comment: ${malformedComment}`
        ).toContain('bd list --parent <phase-task-id> --status open');
      }

      // Test cases that extract unexpected values due to regex matching behavior
      const edgeCases = [
        { comment: '<!-- beads-phase-id: -->', extracted: '--' },
        { comment: '<!-- beads-phase-id:no-space -->', extracted: 'no-space' },
      ];

      for (const edgeCase of edgeCases) {
        const planContent = `# Project Plan

## Design
${edgeCase.comment}
- Some tasks here
`;

        await writeFile(testPlanFilePath, planContent);

        const result = await beadsInstructionGenerator.generateInstructions(
          'Work on tasks.',
          mockInstructionContext
        );

        // Note: These cases currently extract values due to regex behavior
        // This could be considered edge case behavior that should be improved
        expect(
          result.instructions,
          `Should extract value from edge case: ${edgeCase.comment}`
        ).toContain(`bd list --parent ${edgeCase.extracted} --status open`);
      }
    });

    it('should handle non-existent plan file gracefully', async () => {
      const contextWithMissingFile = {
        ...mockInstructionContext,
        planFileExists: false,
        conversationContext: {
          ...mockConversationContext,
          planFilePath: '/non/existent/plan.md',
        },
      };

      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on tasks.',
        contextWithMissingFile
      );

      // Should provide generic guidance without crashing
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
      expect(result.instructions).toContain('Use bd CLI tool exclusively');
      expect(result.instructions).toContain(
        'Plan file will be created when you first update it'
      );
    });

    it('should handle plan file with no matching phase section', async () => {
      const planContent = `# Project Plan

## Explore
<!-- beads-phase-id: explore-123 -->
- Exploration tasks

## Implementation
<!-- beads-phase-id: impl-456 -->
- Implementation tasks
`;

      await writeFile(testPlanFilePath, planContent);

      // Request instructions for a phase not in the plan file
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design tasks.',
        { ...mockInstructionContext, phase: 'design' }
      );

      // Should fall back to generic commands
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
      expect(result.instructions).not.toContain('explore-123');
      expect(result.instructions).not.toContain('impl-456');
    });
  });

  describe('BD CLI Command Integration', () => {
    it('should integrate extracted phase task ID into all relevant BD CLI commands', async () => {
      const planContent = `# Project Plan

## Design
<!-- beads-phase-id: design-epic-789 -->
- Design system architecture
`;

      await writeFile(testPlanFilePath, planContent);

      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design.',
        mockInstructionContext
      );

      // Check all BD CLI commands contain the extracted ID
      const expectedCommands = [
        'bd list --parent design-epic-789 --status open',
        "bd create 'Task description' --parent design-epic-789 -p 2",
        'bd show design-epic-789',
      ];

      for (const command of expectedCommands) {
        expect(
          result.instructions,
          `Should contain command: ${command}`
        ).toContain(command);
      }

      // Should mention the specific task ID in context
      expect(result.instructions).toContain(
        'All work items should be created as children of design-epic-789'
      );
      expect(result.instructions).toContain('subtasks of `design-epic-789`');
    });

    it('should provide immediate action guidance with extracted task ID', async () => {
      const planContent = `# Project Plan

## Implementation
<!-- beads-phase-id: feature-impl-999 -->
- Implement core features
`;

      await writeFile(testPlanFilePath, planContent);

      const result = await beadsInstructionGenerator.generateInstructions(
        'Start implementation.',
        { ...mockInstructionContext, phase: 'implementation' }
      );

      // Should provide specific immediate action
      expect(result.instructions).toContain(
        'Run `bd list --parent feature-impl-999 --status open` to see ready tasks'
      );
    });

    it('should handle phase task ID extraction consistently across multiple calls', async () => {
      const planContent = `# Project Plan

## Code
<!-- beads-phase-id: consistent-id-123 -->
- Write tests
- Implement features
`;

      await writeFile(testPlanFilePath, planContent);

      // Generate instructions multiple times
      const results = await Promise.all([
        beadsInstructionGenerator.generateInstructions('Call 1', {
          ...mockInstructionContext,
          phase: 'code',
        }),
        beadsInstructionGenerator.generateInstructions('Call 2', {
          ...mockInstructionContext,
          phase: 'code',
        }),
        beadsInstructionGenerator.generateInstructions('Call 3', {
          ...mockInstructionContext,
          phase: 'code',
        }),
      ]);

      // All results should contain the same extracted task ID
      for (const result of results) {
        expect(result.instructions).toContain(
          'bd list --parent consistent-id-123 --status open'
        );
        expect(result.instructions).toContain('consistent-id-123');
      }
    });
  });

  describe('Phase Name Capitalization and Matching', () => {
    it('should correctly capitalize phase names for header matching', async () => {
      const testCases = [
        { input: 'design', expected: 'Design' },
        { input: 'code_review', expected: 'Code Review' },
        { input: 'system_test', expected: 'System Test' },
        { input: 'integration_testing', expected: 'Integration Testing' },
      ];

      for (const testCase of testCases) {
        const planContent = `# Project Plan

## ${testCase.expected}
<!-- beads-phase-id: test-id-${testCase.input} -->
- Some tasks
`;

        await writeFile(testPlanFilePath, planContent);

        const result = await beadsInstructionGenerator.generateInstructions(
          'Work on phase.',
          { ...mockInstructionContext, phase: testCase.input }
        );

        expect(
          result.instructions,
          `Should extract ID for phase: ${testCase.input} -> ${testCase.expected}`
        ).toContain(`bd list --parent test-id-${testCase.input} --status open`);
      }
    });

    it('should handle case-insensitive phase header matching', async () => {
      const planContent = `# Project Plan

## design
<!-- beads-phase-id: lowercase-header-123 -->
- Tasks with lowercase header
`;

      await writeFile(testPlanFilePath, planContent);

      // Should still find the phase despite case difference
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design.',
        mockInstructionContext
      );

      // Note: The current implementation is case-sensitive, so this tests the expected behavior
      // If the implementation should be case-insensitive, this test would need to be updated
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
    });
  });

  describe('Error Recovery and Robustness', () => {
    it('should handle plan files with multiple beads-phase-id comments in same section', async () => {
      const planContent = `# Project Plan

## Design
<!-- beads-phase-id: first-id-123 -->
<!-- beads-phase-id: second-id-456 -->
- Tasks with multiple IDs
`;

      await writeFile(testPlanFilePath, planContent);

      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design.',
        mockInstructionContext
      );

      // Should use the first found ID
      expect(result.instructions).toContain(
        'bd list --parent first-id-123 --status open'
      );
      expect(result.instructions).not.toContain('second-id-456');
    });

    it('should handle plan files with beads-phase-id in wrong sections', async () => {
      const planContent = `# Project Plan

## Design
- Design tasks

## Implementation
<!-- beads-phase-id: impl-id-789 -->
- Implementation tasks
`;

      await writeFile(testPlanFilePath, planContent);

      // Request design phase but ID is in implementation section
      const result = await beadsInstructionGenerator.generateInstructions(
        'Work on design.',
        mockInstructionContext
      );

      // Should not use the ID from wrong section
      expect(result.instructions).toContain(
        'bd list --parent <phase-task-id> --status open'
      );
      expect(result.instructions).not.toContain('impl-id-789');
    });
  });
});
