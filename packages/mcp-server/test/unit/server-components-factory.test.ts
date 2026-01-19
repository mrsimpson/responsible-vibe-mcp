/**
 * ServerComponentsFactory Tests
 *
 * Tests the factory pattern implementation for component creation
 * based on task backend configuration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServerComponentsFactory } from '../../src/components/server-components-factory.js';
import {
  TaskBackendManager,
  type TaskBackendConfig,
} from '@codemcp/workflows-core';

// Mock TaskBackendManager
vi.mock('@codemcp/workflows-core', async () => {
  const actual = await vi.importActual('@codemcp/workflows-core');
  return {
    ...actual,
    TaskBackendManager: {
      detectTaskBackend: vi.fn(),
    },
  };
});

describe('ServerComponentsFactory', () => {
  let factory: ServerComponentsFactory;
  let mockDetectTaskBackend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDetectTaskBackend = vi.mocked(TaskBackendManager.detectTaskBackend);
    // Default to markdown backend
    mockDetectTaskBackend.mockReturnValue({
      backend: 'markdown',
      isAvailable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should use TaskBackendManager.detectTaskBackend() when no options provided', () => {
      factory = new ServerComponentsFactory();

      expect(mockDetectTaskBackend).toHaveBeenCalled();
    });

    it('should use provided task backend configuration', () => {
      const customBackend: TaskBackendConfig = {
        backend: 'beads',
        isAvailable: true,
      };

      factory = new ServerComponentsFactory({ taskBackend: customBackend });

      // Should not call detectTaskBackend when explicit config provided
      expect(mockDetectTaskBackend).not.toHaveBeenCalled();
    });

    it('should handle undefined options gracefully', () => {
      factory = new ServerComponentsFactory(undefined);

      expect(mockDetectTaskBackend).toHaveBeenCalled();
    });
  });

  describe('createPlanManager', () => {
    it('should create default PlanManager for markdown backend', () => {
      mockDetectTaskBackend.mockReturnValue({
        backend: 'markdown',
        isAvailable: true,
      });

      factory = new ServerComponentsFactory();
      const planManager = factory.createPlanManager();

      expect(planManager).toBeDefined();
      expect(planManager.constructor.name).toBe('PlanManager');
    });

    it('should create default PlanManager when beads backend unavailable', () => {
      mockDetectTaskBackend.mockReturnValue({
        backend: 'beads',
        isAvailable: false,
      });

      factory = new ServerComponentsFactory();
      const planManager = factory.createPlanManager();

      expect(planManager).toBeDefined();
      expect(planManager.constructor.name).toBe('PlanManager');
    });

    it('should create BeadsPlanManager for beads backend when available', () => {
      // Now that BeadsPlanManager is implemented, test that it's created correctly
      const beadsBackend: TaskBackendConfig = {
        backend: 'beads',
        isAvailable: true,
      };

      factory = new ServerComponentsFactory({ taskBackend: beadsBackend });
      const planManager = factory.createPlanManager();

      expect(planManager).toBeDefined();
      expect(planManager.constructor.name).toBe('BeadsPlanManager');
    });

    it('should create consistent instances across multiple calls', () => {
      factory = new ServerComponentsFactory();

      const planManager1 = factory.createPlanManager();
      const planManager2 = factory.createPlanManager();

      // Should create new instances (not singletons)
      expect(planManager1).not.toBe(planManager2);
      expect(planManager1.constructor.name).toBe(planManager2.constructor.name);
    });
  });

  describe('createInstructionGenerator', () => {
    it('should create default InstructionGenerator for markdown backend', () => {
      mockDetectTaskBackend.mockReturnValue({
        backend: 'markdown',
        isAvailable: true,
      });

      factory = new ServerComponentsFactory();
      const instructionGenerator = factory.createInstructionGenerator();

      expect(instructionGenerator).toBeDefined();
      expect(instructionGenerator.constructor.name).toBe(
        'InstructionGenerator'
      );
    });

    it('should create default InstructionGenerator when beads backend unavailable', () => {
      mockDetectTaskBackend.mockReturnValue({
        backend: 'beads',
        isAvailable: false,
      });

      factory = new ServerComponentsFactory();
      const instructionGenerator = factory.createInstructionGenerator();

      expect(instructionGenerator).toBeDefined();
      expect(instructionGenerator.constructor.name).toBe(
        'InstructionGenerator'
      );
    });

    it('should create BeadsInstructionGenerator for beads backend when available', () => {
      // Now that BeadsInstructionGenerator is implemented, test that it's created correctly
      const beadsBackend: TaskBackendConfig = {
        backend: 'beads',
        isAvailable: true,
      };

      factory = new ServerComponentsFactory({ taskBackend: beadsBackend });
      const instructionGenerator = factory.createInstructionGenerator();

      expect(instructionGenerator).toBeDefined();
      expect(instructionGenerator.constructor.name).toBe(
        'BeadsInstructionGenerator'
      );
    });

    it('should create InstructionGenerator with proper dependency injection', () => {
      factory = new ServerComponentsFactory();
      const instructionGenerator = factory.createInstructionGenerator();

      expect(instructionGenerator).toBeDefined();
      expect(instructionGenerator.constructor.name).toBe(
        'InstructionGenerator'
      );

      // Verify the instance is functional (dependency was injected correctly)
      // without checking internal implementation details
      expect(typeof instructionGenerator.generateInstructions).toBe('function');
    });

    it('should create consistent instances across multiple calls', () => {
      factory = new ServerComponentsFactory();

      const instructionGenerator1 = factory.createInstructionGenerator();
      const instructionGenerator2 = factory.createInstructionGenerator();

      // Should create new instances (not singletons)
      expect(instructionGenerator1).not.toBe(instructionGenerator2);
      expect(instructionGenerator1.constructor.name).toBe(
        instructionGenerator2.constructor.name
      );
    });
  });

  describe('getTaskBackend', () => {
    it('should return the current task backend configuration', () => {
      const customBackend: TaskBackendConfig = {
        backend: 'beads',
        isAvailable: true,
      };

      factory = new ServerComponentsFactory({ taskBackend: customBackend });
      const taskBackend = factory.getTaskBackend();

      expect(taskBackend).toEqual(customBackend);
    });

    it('should return detected task backend when no explicit config provided', () => {
      const detectedBackend: TaskBackendConfig = {
        backend: 'markdown',
        isAvailable: true,
      };
      mockDetectTaskBackend.mockReturnValue(detectedBackend);

      factory = new ServerComponentsFactory();
      const taskBackend = factory.getTaskBackend();

      expect(taskBackend).toEqual(detectedBackend);
    });
  });

  describe('Backend Integration', () => {
    it('should handle unknown backend types gracefully', () => {
      const unknownBackend: TaskBackendConfig = {
        backend: 'unknown-backend' as any,
        isAvailable: true,
      };

      factory = new ServerComponentsFactory({ taskBackend: unknownBackend });

      // Should fall back to default implementations
      const planManager = factory.createPlanManager();
      const instructionGenerator = factory.createInstructionGenerator();

      expect(planManager.constructor.name).toBe('PlanManager');
      expect(instructionGenerator.constructor.name).toBe(
        'InstructionGenerator'
      );
    });

    it('should handle backend availability flag correctly', () => {
      const unavailableBackend: TaskBackendConfig = {
        backend: 'beads',
        isAvailable: false,
      };

      factory = new ServerComponentsFactory({
        taskBackend: unavailableBackend,
      });

      // Should fall back to default implementations when backend unavailable
      const planManager = factory.createPlanManager();
      const instructionGenerator = factory.createInstructionGenerator();

      expect(planManager.constructor.name).toBe('PlanManager');
      expect(instructionGenerator.constructor.name).toBe(
        'InstructionGenerator'
      );
    });
  });

  describe('Future Extensibility', () => {
    // These tests document the expected behavior once beads implementations are created
    it.todo(
      'should create BeadsPlanManager when beads backend is available and implemented'
    );
    it.todo(
      'should create BeadsInstructionGenerator when beads backend is available and implemented'
    );
    it.todo(
      'should support additional backends (github, linear) through same factory pattern'
    );
  });
});
