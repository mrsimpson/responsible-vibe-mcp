/**
 * Test plugin hook integration in proceed-to-phase
 * Focus on testing that plugin hooks are called correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProceedToPhaseHandler } from '../../src/tool-handlers/proceed-to-phase.js';
import { PluginRegistry } from '../../src/plugin-system/plugin-registry.js';
import type { ServerContext } from '../../src/types.js';
import type { PluginHookContext } from '../../src/plugin-system/plugin-interfaces.js';

// Mock dependencies
vi.mock('@codemcp/workflows-core', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ProceedToPhase Plugin Integration', () => {
  let handler: ProceedToPhaseHandler;
  let mockPluginRegistry: PluginRegistry;
  let mockContext: ServerContext;

  beforeEach(() => {
    mockPluginRegistry = new PluginRegistry();

    mockContext = {
      conversationManager: {
        getConversationContext: vi.fn().mockResolvedValue({
          conversationId: 'test-conversation',
          planFilePath: '/test/plan.md',
          currentPhase: 'plan',
          workflowName: 'epcc',
          projectPath: '/test/project',
          gitBranch: 'main',
        }),
        updateConversationState: vi.fn().mockResolvedValue(undefined),
      },
      transitionEngine: {
        handleExplicitTransition: vi.fn().mockReturnValue({
          newPhase: 'code',
          transitionReason: 'Test transition',
          isModeled: true,
          instructions: 'Test transition instructions',
        }),
      },
      planManager: {
        getPlanFileInfo: vi.fn().mockResolvedValue({ exists: true }),
      },
      instructionGenerator: {
        generateInstructions: vi.fn().mockResolvedValue({
          instructions: 'Test instructions',
        }),
      },
      workflowManager: {
        loadWorkflowForProject: vi.fn().mockReturnValue({
          name: 'epcc',
          states: { plan: {}, code: {} },
        }),
      },
      interactionLogger: {
        logInteraction: vi.fn().mockResolvedValue(undefined),
      },
      projectPath: '/test/project',
      pluginRegistry: mockPluginRegistry,
    } as unknown as ServerContext;

    handler = new ProceedToPhaseHandler();
  });

  it('should call beforePhaseTransition plugin hook during phase transition', async () => {
    const hookSpy = vi.fn().mockResolvedValue(undefined);

    // Register a mock plugin with beforePhaseTransition hook
    const mockPlugin = {
      getName: () => 'TestPlugin',
      getSequence: () => 100,
      isEnabled: () => true,
      getHooks: () => ({
        beforePhaseTransition: hookSpy,
      }),
    };

    mockPluginRegistry.registerPlugin(mockPlugin);

    // Execute the proceed_to_phase handler
    await handler.handle(
      {
        target_phase: 'code',
        reason: 'Testing plugin integration',
        review_state: 'not-required',
      },
      mockContext
    );

    // Verify the hook was called with correct parameters
    expect(hookSpy).toHaveBeenCalledOnce();

    const [pluginContext, currentPhase, targetPhase] = hookSpy.mock.calls[0];

    // Verify plugin context structure
    expect(pluginContext).toMatchObject<Partial<PluginHookContext>>({
      conversationId: 'test-conversation',
      planFilePath: '/test/plan.md',
      currentPhase: 'plan',
      workflow: 'epcc',
      projectPath: '/test/project',
      gitBranch: 'main',
      targetPhase: 'code',
    });

    // Verify phase parameters
    expect(currentPhase).toBe('plan');
    expect(targetPhase).toBe('code');
  });

  it('should handle plugin hook errors by returning error result', async () => {
    const hookError = new Error('Plugin validation failed');
    const hookSpy = vi.fn().mockRejectedValue(hookError);

    // Register a mock plugin that throws an error
    const mockPlugin = {
      getName: () => 'TestPlugin',
      getSequence: () => 100,
      isEnabled: () => true,
      getHooks: () => ({
        beforePhaseTransition: hookSpy,
      }),
    };

    mockPluginRegistry.registerPlugin(mockPlugin);

    // Execute the handler and expect it to return error result
    const result = await handler.handle(
      {
        target_phase: 'code',
        reason: 'Testing plugin error handling',
        review_state: 'not-required',
      },
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Plugin validation failed');
    expect(hookSpy).toHaveBeenCalledOnce();
  });
});
