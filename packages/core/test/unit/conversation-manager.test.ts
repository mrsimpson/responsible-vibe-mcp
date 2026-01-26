/**
 * Unit tests for ConversationManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationManager } from '../../src/conversation-manager.js';
import type { IPersistence } from '../../src/persistence-interface.js';
import type { WorkflowManager } from '../../src/workflow-manager.js';

// Mock WorkflowManager state machine
const mockStateMachine = {
  name: 'Test Workflow',
  description: 'Test workflow for unit tests',
  initial_state: 'idle',
  states: {
    idle: {
      description: 'Idle state',
      transitions: [],
    },
  },
};

describe('ConversationManager', () => {
  let conversationManager: ConversationManager;

  // Mock database functions
  const mockGetConversationState = vi.fn();
  const mockSaveConversationState = vi.fn();
  const mockDeleteConversationState = vi.fn();
  const mockSoftDeleteInteractionLogs = vi.fn();
  const mockGetAllConversationStates = vi.fn();
  const mockLogInteraction = vi.fn();
  const mockGetInteractionLogs = vi.fn();
  const mockGetInteractionsByConversationId = vi.fn();
  const mockResetConversationState = vi.fn();
  const mockInitialize = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Create mock WorkflowManager
    const mockWorkflowManager = {
      loadWorkflowForProject: vi.fn().mockReturnValue(mockStateMachine),
      validateWorkflowName: vi.fn().mockReturnValue(true),
      getWorkflowNames: vi
        .fn()
        .mockReturnValue([
          'mock-workflow-1',
          'mock-workflow-2',
          'mock-workflow-3',
        ]),
    };

    // Create a mock database with the mocked functions
    const mockDb = {
      getConversationState: mockGetConversationState,
      saveConversationState: mockSaveConversationState,
      deleteConversationState: mockDeleteConversationState,
      softDeleteInteractionLogs: mockSoftDeleteInteractionLogs,
      getAllConversationStates: mockGetAllConversationStates,
      logInteraction: mockLogInteraction,
      getInteractionLogs: mockGetInteractionLogs,
      getInteractionsByConversationId: mockGetInteractionsByConversationId,
      resetConversationState: mockResetConversationState,
      initialize: mockInitialize,
      close: mockClose,
    };

    // Create conversation manager with dependency injection
    conversationManager = new ConversationManager(
      mockDb as IPersistence,
      mockWorkflowManager as unknown as WorkflowManager,
      '/test/project/path'
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getConversationContext', () => {
    it('should throw an error when no conversation exists', async () => {
      // Mock database to return null (no conversation)
      mockGetConversationState.mockResolvedValue(null);

      // Expect the method to throw an error
      await expect(
        conversationManager.getConversationContext()
      ).rejects.toThrow(
        'No development conversation exists for this project. Use the start_development tool first to initialize development with a workflow.'
      );

      // Verify database was called with expected ID
      expect(mockGetConversationState).toHaveBeenCalledWith(expect.any(String));
    });

    it('should return conversation context when conversation exists', async () => {
      // Mock existing conversation state
      const mockState = {
        conversationId: 'test-conversation-id',
        projectPath: '/test/project/path',
        gitBranch: 'main',
        currentPhase: 'idle',
        planFilePath: '/test/project/path/.vibe/development-plan.md',
        workflowName: 'custom',
        createdAt: '2025-06-25T00:00:00.000Z',
        updatedAt: '2025-06-25T00:00:00.000Z',
      };

      mockGetConversationState.mockResolvedValue(mockState);

      // Call the method
      const result = await conversationManager.getConversationContext();

      // Verify result
      expect(result).toEqual({
        conversationId: 'test-conversation-id',
        projectPath: '/test/project/path',
        gitBranch: 'main',
        currentPhase: 'idle',
        planFilePath: '/test/project/path/.vibe/development-plan.md',
        workflowName: 'custom',
      });

      // Verify database was called with expected ID
      expect(mockGetConversationState).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('createConversationContext', () => {
    it('should create a new conversation when none exists', async () => {
      // Mock database to return null (no conversation) then accept the new state
      mockGetConversationState.mockResolvedValue(null);
      mockSaveConversationState.mockResolvedValue(undefined);

      // Call the method
      const result =
        await conversationManager.createConversationContext('mock-workflow');

      // Verify result has expected structure
      expect(result).toHaveProperty('conversationId');
      expect(result).toHaveProperty('gitBranch', 'default');
      expect(result).toHaveProperty('currentPhase', 'idle'); // Should be idle from mock state machine
      expect(result).toHaveProperty('planFilePath');
      expect(result).toHaveProperty('workflowName', 'mock-workflow');

      // Verify database was called to save the new state
      expect(mockSaveConversationState).toHaveBeenCalled();
      const savedState = mockSaveConversationState.mock.calls[0][0];
      expect(savedState.workflowName).toBe('mock-workflow'); // Should match what we passed in
      expect(savedState.currentPhase).toBe('idle');
    });

    it('should return existing conversation when one already exists with same workflow', async () => {
      // Mock existing conversation state with same workflow
      const mockState = {
        conversationId: 'test-conversation-id',
        projectPath: '/test/project/path',
        gitBranch: 'main',
        currentPhase: 'idle',
        planFilePath: '/test/project/path/.vibe/development-plan.md',
        workflowName: 'existing-workflow',
        createdAt: '2025-06-25T00:00:00.000Z',
        updatedAt: '2025-06-25T00:00:00.000Z',
      };

      mockGetConversationState.mockResolvedValue(mockState);

      // Call the method with the SAME workflow
      const result =
        await conversationManager.createConversationContext(
          'existing-workflow'
        );

      // Verify result is the existing conversation
      expect(result).toEqual({
        conversationId: 'test-conversation-id',
        projectPath: '/test/project/path',
        gitBranch: 'main',
        currentPhase: 'idle',
        planFilePath: '/test/project/path/.vibe/development-plan.md',
        workflowName: 'existing-workflow',
      });

      // Verify database was NOT called to save a new state
      expect(mockSaveConversationState).not.toHaveBeenCalled();
    });

    it('should throw error when trying to change workflow on existing conversation', async () => {
      // Mock existing conversation state with different workflow
      const mockState = {
        conversationId: 'test-conversation-id',
        projectPath: '/test/project/path',
        gitBranch: 'main',
        currentPhase: 'idle',
        planFilePath: '/test/project/path/.vibe/development-plan.md',
        workflowName: 'existing-workflow',
        createdAt: '2025-06-25T00:00:00.000Z',
        updatedAt: '2025-06-25T00:00:00.000Z',
      };

      mockGetConversationState.mockResolvedValue(mockState);

      // Call the method with a DIFFERENT workflow - should throw
      await expect(
        conversationManager.createConversationContext('different-workflow')
      ).rejects.toThrow(
        "Development conversation already exists with workflow 'existing-workflow'. Cannot change to 'different-workflow'. Use reset_development() first to start with a new workflow."
      );

      // Verify database was NOT called to save a new state
      expect(mockSaveConversationState).not.toHaveBeenCalled();
    });
  });
});
