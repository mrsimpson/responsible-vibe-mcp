/**
 * Task Backend Tests
 *
 * Tests for task backend detection and validation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskBackendManager } from '../../src/task-backend.js';
import { execSync } from 'node:child_process';
import {
  beadsMockHelpers,
  taskBackendConfigs,
} from '../utils/beads-test-helpers.js';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('TaskBackendManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('detectTaskBackend', () => {
    it('should default to markdown when TASK_BACKEND is not set', () => {
      delete process.env['TASK_BACKEND'];

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should default to markdown when TASK_BACKEND is empty', () => {
      process.env['TASK_BACKEND'] = '';

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should default to markdown when TASK_BACKEND is invalid', () => {
      process.env['TASK_BACKEND'] = 'invalid-backend';

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should use markdown when explicitly set', () => {
      process.env['TASK_BACKEND'] = 'markdown';

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should use markdown when set with different case', () => {
      process.env['TASK_BACKEND'] = 'MARKDOWN';

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should detect beads when available', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsAvailable(mockExecSync);

      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual(taskBackendConfigs.beads);
      expect(mockExecSync).toHaveBeenCalledWith(
        'bd --version',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 5000,
        })
      );
    });

    it('should detect beads as unavailable when command not found', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsNotFound(mockExecSync);

      const config = TaskBackendManager.detectTaskBackend();

      expect(config.backend).toBe('beads');
      expect(config.isAvailable).toBe(false);
      expect(config.errorMessage).toContain('Beads command (bd) not found');
    });

    it('should detect beads as unavailable when command times out', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsTimeout(mockExecSync);

      const config = TaskBackendManager.detectTaskBackend();

      expect(config.backend).toBe('beads');
      expect(config.isAvailable).toBe(false);
      expect(config.errorMessage).toContain('timed out');
    });
  });

  describe('validateTaskBackend', () => {
    it('should succeed for markdown backend', () => {
      process.env['TASK_BACKEND'] = 'markdown';

      const config = TaskBackendManager.validateTaskBackend();

      expect(config).toEqual({
        backend: 'markdown',
        isAvailable: true,
      });
    });

    it('should succeed for available beads backend', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsAvailable(mockExecSync);

      const config = TaskBackendManager.validateTaskBackend();

      expect(config).toEqual(taskBackendConfigs.beads);
    });

    it('should throw error for unavailable beads backend', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsNotFound(mockExecSync);

      expect(() => {
        TaskBackendManager.validateTaskBackend();
      }).toThrow(/Task backend 'beads' is not available/);
    });
  });

  describe('getBeadsSetupInstructions', () => {
    it('should return detailed setup instructions', () => {
      const instructions = TaskBackendManager.getBeadsSetupInstructions();

      expect(instructions).toContain('## Beads Setup Required');
      expect(instructions).toContain('git clone');
      expect(instructions).toContain('make install');
      expect(instructions).toContain('bd --version');
      expect(instructions).toContain('export TASK_BACKEND=beads');
    });
  });

  describe('Method Reference Handling', () => {
    // This test specifically targets the bug where calling TaskBackendManager.detectTaskBackend
    // as a function reference (not bound to the class) would fail because `this.checkBeadsAvailability()`
    // was being called instead of `TaskBackendManager.checkBeadsAvailability()`.
    it('should work when detectTaskBackend is called as unbound function reference', () => {
      // This is the exact scenario that was failing before the fix
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsAvailable(mockExecSync);

      // Extract the method as a function reference (simulates how InstructionGenerator uses it)
      const detectTaskBackendFn = TaskBackendManager.detectTaskBackend;

      // Before the fix, this would throw "this.checkBeadsAvailability is not a function"
      // After the fix, it should work correctly
      const config = detectTaskBackendFn();

      expect(config).toEqual(taskBackendConfigs.beads);
      expect(mockExecSync).toHaveBeenCalledWith(
        'bd --version',
        expect.objectContaining({
          encoding: 'utf-8',
          timeout: 5000,
        })
      );
    });

    it('should continue to work when called normally as static method', () => {
      process.env['TASK_BACKEND'] = 'beads';

      const mockExecSync = vi.mocked(execSync);
      beadsMockHelpers.setupBeadsAvailable(mockExecSync);

      // This was already working before the fix
      const config = TaskBackendManager.detectTaskBackend();

      expect(config).toEqual(taskBackendConfigs.beads);
    });
  });
});
