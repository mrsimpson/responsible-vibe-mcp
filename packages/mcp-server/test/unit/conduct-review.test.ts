/**
 * Unit tests for ConductReviewHandler
 * Tests the expected behavior of conducting reviews before phase transitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConductReviewHandler } from '../../src/tool-handlers/conduct-review.js';
import type { ServerContext } from '../../src/types';
import type { ConversationContext } from '../../src/types.js';

// Mock logger
vi.mock('../../src/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ConductReviewHandler', () => {
  let handler: ConductReviewHandler;
  let mockContext: ServerContext;

  beforeEach(() => {
    handler = new ConductReviewHandler();

    mockContext = {
      workflowManager: {
        loadWorkflowForProject: vi.fn(),
      },
      transitionEngine: {
        getStateMachine: vi.fn(),
      },
      planManager: {
        setStateMachine: vi.fn(),
      },
      instructionGenerator: {
        setStateMachine: vi.fn(),
      },
      projectPath: '/test/project',
    } as unknown as ServerContext;
  });

  it('should conduct review for ideation to architecture transition in greenfield workflow', async () => {
    // Set up greenfield workflow
    const mockWorkflow = {
      states: {
        ideation: {
          transitions: [
            {
              trigger: 'ideation_complete',
              to: 'architecture',
              review_perspectives: [
                {
                  perspective: 'business_analyst',
                  prompt:
                    'Review the Product Requirements Document for completeness, clarity, and business value.',
                },
                {
                  perspective: 'ux_expert',
                  prompt:
                    'Evaluate user experience requirements and usability considerations.',
                },
              ],
            },
          ],
        },
      },
    };

    mockContext.workflowManager.loadWorkflowForProject.mockReturnValue(
      mockWorkflow
    );

    const conversationContext: ConversationContext = {
      conversationId: 'test-conversation',
      projectPath: '/test/project',
      gitBranch: 'main',
      currentPhase: 'ideation',
      planFilePath: '/test/project/.vibe/plan.md',
      workflowName: 'greenfield',
      requireReviewsBeforePhaseTransition: true,
    };

    const result = await handler.executeWithConversation(
      { target_phase: 'architecture' },
      mockContext,
      conversationContext
    );

    expect(result.instructions).toContain('ideation');
    expect(result.instructions).toContain('architecture');
    expect(result.perspectives).toHaveLength(2);
    expect(result.perspectives[0].name).toBe('business_analyst');
    expect(result.perspectives[1].name).toBe('ux_expert');
  });

  it('should handle the reported bug scenario: ideation_complete transition with reviews', async () => {
    const mockWorkflow = {
      states: {
        ideation: {
          transitions: [
            {
              trigger: 'ideation_complete',
              to: 'architecture',
              review_perspectives: [
                {
                  perspective: 'business_analyst',
                  prompt:
                    'Review the Product Requirements Document for completeness, clarity, and business value.',
                },
                {
                  perspective: 'ux_expert',
                  prompt:
                    'Evaluate user experience requirements and usability considerations.',
                },
              ],
            },
          ],
        },
      },
    };

    mockContext.workflowManager.loadWorkflowForProject.mockReturnValue(
      mockWorkflow
    );

    const conversationContext: ConversationContext = {
      conversationId: 'test-conversation',
      projectPath: '/test/project',
      gitBranch: 'main',
      currentPhase: 'ideation',
      planFilePath: '/test/project/.vibe/plan.md',
      workflowName: 'greenfield',
      requireReviewsBeforePhaseTransition: true,
    };

    const result = await handler.executeWithConversation(
      { target_phase: 'architecture' },
      mockContext,
      conversationContext
    );

    expect(result.instructions).toContain('ideation');
    expect(result.instructions).toContain('architecture');
    expect(result.perspectives).toHaveLength(2);
    expect(result.perspectives[0].name).toBe('business_analyst');
    expect(result.perspectives[1].name).toBe('ux_expert');
  });
});
