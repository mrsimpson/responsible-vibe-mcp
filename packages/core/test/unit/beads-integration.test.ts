import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BeadsIntegration } from '../../src/beads-integration';
import { execSync } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('BeadsIntegration', () => {
  let beadsIntegration: BeadsIntegration;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    beadsIntegration = new BeadsIntegration('/test/project');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Auto-Initialization', () => {
    it('should auto-initialize beads when not initialized', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock first call (check if initialized) to fail with initialization error
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('beads not initialized in this directory');
        })
        // Mock bd init --no-db to succeed
        .mockImplementationOnce(() => {
          return 'Initialized beads in /test/project\n';
        })
        // Mock bd create to succeed (for epic creation)
        .mockImplementationOnce(() => {
          return '✓ Created issue: project-epic-123\n';
        });

      // This should trigger auto-initialization
      const epicId = await beadsIntegration.createProjectEpic(
        'Test Project',
        'epcc'
      );

      expect(epicId).toBe('project-epic-123');

      // Verify the calls made
      expect(mockExecSync).toHaveBeenCalledTimes(3);

      // First call: check if initialized
      expect(mockExecSync).toHaveBeenNthCalledWith(1, 'bd list --limit 1', {
        cwd: '/test/project',
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Second call: auto-initialize
      expect(mockExecSync).toHaveBeenNthCalledWith(2, 'bd init --no-db', {
        cwd: '/test/project',
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Third call: create epic
      expect(mockExecSync).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('bd create'),
        expect.objectContaining({
          cwd: '/test/project',
        })
      );
    });

    it('should skip initialization when beads is already initialized', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock first call (check if initialized) to succeed
      mockExecSync
        .mockImplementationOnce(() => {
          return 'No issues found\n'; // bd list succeeds
        })
        // Mock bd create to succeed (for epic creation)
        .mockImplementationOnce(() => {
          return '✓ Created issue: project-epic-456\n';
        });

      const epicId = await beadsIntegration.createProjectEpic(
        'Test Project',
        'epcc'
      );

      expect(epicId).toBe('project-epic-456');

      // Verify only 2 calls made (no initialization needed)
      expect(mockExecSync).toHaveBeenCalledTimes(2);

      // Should not have called bd init
      expect(mockExecSync).not.toHaveBeenCalledWith(
        'bd init --no-db',
        expect.any(Object)
      );
    });

    it('should throw error when initialization fails', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock first call to fail with initialization error
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('beads not initialized');
        })
        // Mock bd init to fail
        .mockImplementationOnce(() => {
          throw new Error('Failed to initialize: permission denied');
        });

      await expect(
        beadsIntegration.createProjectEpic('Test Project', 'epcc')
      ).rejects.toThrow(
        'Failed to initialize beads: Failed to initialize: permission denied'
      );

      // Verify initialization was attempted
      expect(mockExecSync).toHaveBeenCalledWith('bd init --no-db', {
        cwd: '/test/project',
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    });

    it('should re-throw other beads errors without trying to initialize', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock first call to fail with a different error (not initialization-related)
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('beads command not found');
      });

      await expect(
        beadsIntegration.createProjectEpic('Test Project', 'epcc')
      ).rejects.toThrow('beads command not found');

      // Should only have called the check command, no initialization attempt
      expect(mockExecSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Core Integration', () => {
    it('should create project epic successfully', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock beads already initialized and epic creation
      mockExecSync
        .mockImplementationOnce(() => 'No issues found\n') // bd list succeeds
        .mockImplementationOnce(() => '✓ Created issue: test-epic-789\n'); // epic creation

      const epicId = await beadsIntegration.createProjectEpic(
        'My Test Project',
        'greenfield'
      );

      expect(epicId).toBe('test-epic-789');

      // Verify epic creation command
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('bd create "My Test Project: greenfield"'),
        expect.objectContaining({
          cwd: '/test/project',
          encoding: 'utf-8',
        })
      );
    });

    it('should validate parameters before creating epic', async () => {
      const mockExecSync = vi.mocked(execSync);
      await expect(
        beadsIntegration.createProjectEpic('', 'epcc')
      ).rejects.toThrow('Project name is required and cannot be empty');

      await expect(
        beadsIntegration.createProjectEpic('Test', '')
      ).rejects.toThrow('Workflow name is required and cannot be empty');

      // Should not have made any beads calls
      expect(mockExecSync).not.toHaveBeenCalled();
    });
  });

  describe('Task ID Extraction with Periods', () => {
    it('should extract task IDs with periods correctly in createProjectEpic', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock beads already initialized and epic creation with hierarchical ID
      mockExecSync
        .mockImplementationOnce(() => 'No issues found\n') // bd list succeeds
        .mockImplementationOnce(() => '✓ Created issue: responsible-vibe-1\n'); // epic creation with period

      const epicId = await beadsIntegration.createProjectEpic(
        'Test Project',
        'epcc'
      );

      expect(epicId).toBe('responsible-vibe-1');
    });

    it('should extract task IDs with multiple periods correctly in createPhaseTasks', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock phase task creation with hierarchical IDs (no initialization check needed for createPhaseTasks)
      mockExecSync
        .mockImplementationOnce(() => '✓ Created issue: project-1.1\n') // first phase
        .mockImplementationOnce(() => '✓ Created issue: project-1.2\n') // second phase
        .mockImplementationOnce(() => '✓ Created issue: project-1.3\n'); // third phase

      const mockPhases = {
        explore: {
          description: 'Exploration phase',
          default_instructions:
            'Explore the codebase and understand requirements',
          transitions: [],
        },
        plan: {
          description: 'Planning phase',
          default_instructions: 'Create detailed plan and design',
          transitions: [],
        },
        code: {
          description: 'Coding phase',
          default_instructions: 'Implement the planned solution',
          transitions: [],
        },
      };

      const phaseTasks = await beadsIntegration.createPhaseTasks(
        'project-1',
        mockPhases,
        'epcc'
      );

      expect(phaseTasks).toHaveLength(3);
      expect(phaseTasks[0]).toEqual({
        phaseId: 'explore',
        phaseName: 'Explore',
        taskId: 'project-1.1',
      });
      expect(phaseTasks[1]).toEqual({
        phaseId: 'plan',
        phaseName: 'Plan',
        taskId: 'project-1.2',
      });
      expect(phaseTasks[2]).toEqual({
        phaseId: 'code',
        phaseName: 'Code',
        taskId: 'project-1.3',
      });
    });

    it('should handle legacy format task IDs without periods', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Clear any previous mocks
      mockExecSync.mockClear();

      // Mock beads already initialized and epic creation with legacy ID format
      mockExecSync
        .mockImplementationOnce(() => 'No issues found\n') // bd list succeeds
        .mockImplementationOnce(() => 'Created bd-abc123\n'); // legacy format

      const epicId = await beadsIntegration.createProjectEpic(
        'Test Project',
        'epcc'
      );

      expect(epicId).toBe('bd-abc123');
    });

    it('should handle mixed format scenarios', async () => {
      const mockExecSync = vi.mocked(execSync);

      // Mock different output formats in sequence (no initialization check for createPhaseTasks)
      mockExecSync
        .mockImplementationOnce(() => '✓ Created issue: my-project-123.456\n') // new format with periods
        .mockImplementationOnce(() => 'Created issue: task-789\n') // new format without periods
        .mockImplementationOnce(() => 'Created bd-xyz.1\n'); // legacy format with periods

      const mockPhases = {
        explore: {
          description: 'Exploration phase',
          default_instructions:
            'Explore the codebase and understand requirements',
          transitions: [],
        },
        plan: {
          description: 'Planning phase',
          default_instructions: 'Create detailed plan and design',
          transitions: [],
        },
        code: {
          description: 'Coding phase',
          default_instructions: 'Implement the planned solution',
          transitions: [],
        },
      };

      const phaseTasks = await beadsIntegration.createPhaseTasks(
        'my-project-123',
        mockPhases,
        'epcc'
      );

      expect(phaseTasks).toHaveLength(3);
      expect(phaseTasks[0].taskId).toBe('my-project-123.456');
      expect(phaseTasks[1].taskId).toBe('task-789');
      expect(phaseTasks[2].taskId).toBe('bd-xyz.1');
    });
  });
});
