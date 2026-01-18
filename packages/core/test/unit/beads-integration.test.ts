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
        expect.stringContaining(
          'bd create "Responsible-Vibe Development: My Test Project"'
        ),
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
});
