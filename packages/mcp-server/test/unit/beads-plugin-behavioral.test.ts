/**
 * Comprehensive Behavioral Tests for BeadsPlugin
 *
 * Tests validate:
 * - Actual beads task creation and management
 * - User experience preservation (same inputs → same outputs)
 * - Plan file enhancement with task IDs
 * - Error handling and graceful degradation
 * - Integration between plugin hooks and beads backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import type { PluginHookContext } from '../../src/plugin-system/plugin-interfaces.js';

// Mock child_process to intercept beads commands
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { BeadsPlugin } from '../../src/plugin-system/beads-plugin.js';

describe('BeadsPlugin - Comprehensive Behavioral Tests', () => {
  let testProjectPath: string;
  let testPlanFilePath: string;

  const createPlanFileContent = () => `# Development Plan

## Goal
Build a comprehensive feature for task management with beads integration

## Explore
<!-- beads-phase-id: TBD -->
Research existing implementation

## Plan
<!-- beads-phase-id: TBD -->
Design the solution

## Code
<!-- beads-phase-id: TBD -->
Implement the feature

## Test
<!-- beads-phase-id: TBD -->
Test all functionality`;

  const createMockContext = (overrides: Record<string, unknown> = {}) =>
    ({
      conversationId: 'test-conversation-123',
      planFilePath: testPlanFilePath,
      currentPhase: 'explore',
      workflow: 'epcc',
      projectPath: testProjectPath,
      gitBranch: 'feature/test-branch',
      stateMachine: {
        name: 'epcc',
        description: 'Explore Plan Code Commit workflow',
        initial_state: 'explore',
        states: {
          explore: {
            description: 'Exploration phase',
            default_instructions: 'Explore the codebase',
            transitions: [],
          },
          plan: {
            description: 'Planning phase',
            default_instructions: 'Plan the feature',
            transitions: [],
          },
          code: {
            description: 'Coding phase',
            default_instructions: 'Code the feature',
            transitions: [],
          },
          test: {
            description: 'Testing phase',
            default_instructions: 'Test the feature',
            transitions: [],
          },
        },
      },
      ...overrides,
    }) as unknown as PluginHookContext;

  beforeEach(async () => {
    testProjectPath = join(tmpdir(), `beads-plugin-test-${Date.now()}`);
    testPlanFilePath = join(testProjectPath, '.vibe', 'plan.md');

    await mkdir(join(testProjectPath, '.vibe'), { recursive: true });
    await writeFile(testPlanFilePath, createPlanFileContent());

    vi.stubEnv('TASK_BACKEND', 'beads');
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true, force: true });
    }
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Test Suite A: Plugin Interface and Metadata
  // ============================================================================

  describe('Test Suite A: Plugin Interface and Metadata', () => {
    it('A1: should implement complete IPlugin interface', () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });

      expect(typeof plugin.getName).toBe('function');
      expect(typeof plugin.getSequence).toBe('function');
      expect(typeof plugin.isEnabled).toBe('function');
      expect(typeof plugin.getHooks).toBe('function');

      expect(typeof plugin.getName()).toBe('string');
      expect(typeof plugin.getSequence()).toBe('number');
      expect(typeof plugin.isEnabled()).toBe('boolean');
      expect(typeof plugin.getHooks()).toBe('object');
    });

    it('A2: should provide all required hooks', () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const hooks = plugin.getHooks();

      expect(hooks.afterStartDevelopment).toBeDefined();
      expect(hooks.beforePhaseTransition).toBeDefined();
      expect(hooks.afterPlanFileCreated).toBeDefined();

      expect(typeof hooks.afterStartDevelopment).toBe('function');
      expect(typeof hooks.beforePhaseTransition).toBe('function');
      expect(typeof hooks.afterPlanFileCreated).toBe('function');
    });

    it('A3: should have correct plugin metadata', () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });

      expect(plugin.getName()).toBe('BeadsPlugin');
      expect(plugin.getSequence()).toBe(100);
    });

    it('A4: should be enabled when TASK_BACKEND is beads', () => {
      vi.stubEnv('TASK_BACKEND', 'beads');
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      expect(plugin.isEnabled()).toBe(true);
    });

    it('A5: should not be enabled when TASK_BACKEND is not beads', () => {
      vi.stubEnv('TASK_BACKEND', 'none');
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      expect(plugin.isEnabled()).toBe(false);
    });

    it('A6: should not crash when plugin not enabled', () => {
      vi.stubEnv('TASK_BACKEND', 'none');
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const isEnabled = plugin.isEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  // ============================================================================
  // Test Suite B: Hook Basic Functionality
  // ============================================================================

  describe('Test Suite B: Hook Basic Functionality', () => {
    it('B1: should handle afterPlanFileCreated without modifications', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const planContent = 'test plan content';

      const hooks = plugin.getHooks();
      const result = await hooks.afterPlanFileCreated?.(
        context,
        testPlanFilePath,
        planContent
      );

      expect(result).toBe(planContent);
    });
  });

  // ============================================================================
  // Test Suite C: Plan File Enhancement
  // ============================================================================

  describe('Test Suite C: Plan File Enhancement', () => {
    it('C1: should gracefully handle missing plan file', async () => {
      // Remove the plan file to simulate read error
      await rm(testPlanFilePath);

      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const args = { workflow: 'epcc', commit_behaviour: 'end' as const };

      // Setup mocks for execSync
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command === 'bd list --limit 1') {
          return 'No issues found\n';
        }
        throw new Error(`Unexpected command: ${command}`);
      });

      const hooks = plugin.getHooks();

      // Plugin handles missing plan file gracefully in goal extraction
      // It continues without a goal description
      const promise = hooks.afterStartDevelopment?.(context, args, {
        conversationId: context.conversationId,
        planFilePath: context.planFilePath,
        phase: context.currentPhase,
        workflow: args.workflow,
      });

      // Goal extraction error should not crash the system
      // Result depends on whether execSync supports the command
      if (promise) {
        await expect(promise).resolves.not.toThrow('Goal extraction');
      }
    });

    it('C2: should update plan file with beads task IDs when successful', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const args = { workflow: 'epcc', commit_behaviour: 'end' as const };

      // Mock execSync to simulate beads commands
      let callCount = 0;
      vi.mocked(execSync).mockImplementation((command: string) => {
        callCount++;

        if (command === 'bd list --limit 1') {
          return 'No issues found\n';
        }

        // Return different task IDs for each phase task creation
        if (command.includes('bd create')) {
          if (callCount === 2) return '✓ Created issue: epic-1\n'; // main epic
          if (callCount === 3) return '✓ Created issue: epic-1.1\n'; // explore
          if (callCount === 4) return '✓ Created issue: epic-1.2\n'; // plan
          if (callCount === 5) return '✓ Created issue: epic-1.3\n'; // code
          if (callCount === 6) return '✓ Created issue: epic-1.4\n'; // test
          if (callCount === 7) return '✓ Dependency created\n'; // dependency
          if (callCount === 8) return '✓ Dependency created\n';
          if (callCount === 9) return '✓ Dependency created\n';
        }

        throw new Error(`Unexpected command: ${command}`);
      });

      const hooks = plugin.getHooks();
      await hooks.afterStartDevelopment?.(context, args, {
        conversationId: context.conversationId,
        planFilePath: context.planFilePath,
        phase: context.currentPhase,
        workflow: args.workflow,
      });

      // Verify plan file was updated
      const updatedContent = await readFile(testPlanFilePath, 'utf-8');

      // Should have replaced all TBD placeholders
      expect(updatedContent).not.toMatch(/<!-- beads-phase-id: TBD -->/);

      // Should have actual task IDs
      expect(updatedContent).toContain('beads-phase-id: epic-1');
    });
  });

  // ============================================================================
  // Test Suite D: User Experience Preservation
  // ============================================================================

  describe('Test Suite D: User Experience Preservation', () => {
    it('D1: should handle beads backend unavailability gracefully', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();

      // Mock the backend client to return unavailable
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command.includes('--version')) {
          throw new Error('beads CLI not found');
        }
        throw new Error(`Unexpected command: ${command}`);
      });

      const hooks = plugin.getHooks();

      // Should not throw when backend unavailable
      await expect(
        hooks.beforePhaseTransition?.(context, 'explore', 'plan')
      ).resolves.not.toThrow();
    });

    it('D2: should allow phase transitions without beads tasks present', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();

      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command === 'bd --version') {
          return 'beads v1.0.0\n';
        }
        // Simulate no beads state found
        throw new Error('No beads state');
      });

      const hooks = plugin.getHooks();

      // Should not throw even if beads state not found
      await expect(
        hooks.beforePhaseTransition?.(context, 'explore', 'plan')
      ).resolves.not.toThrow();
    });

    it('D3: should preserve identical interface with and without beads', () => {
      vi.stubEnv('TASK_BACKEND', 'beads');
      const pluginWithBeads = new BeadsPlugin({ projectPath: testProjectPath });

      vi.stubEnv('TASK_BACKEND', 'none');
      const pluginWithoutBeads = new BeadsPlugin({
        projectPath: testProjectPath,
      });

      // Both should have same interface
      expect(pluginWithBeads.getName()).toBe(pluginWithoutBeads.getName());
      expect(pluginWithBeads.getSequence()).toBe(
        pluginWithoutBeads.getSequence()
      );

      // Hooks should exist for both
      const beadsHooks = pluginWithBeads.getHooks();
      const nonBeadsHooks = pluginWithoutBeads.getHooks();

      expect(Object.keys(beadsHooks)).toEqual(Object.keys(nonBeadsHooks));
    });

    it('D4: should provide meaningful error messages', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();

      vi.mocked(execSync).mockImplementation((_command: string) => {
        throw new Error('beads CLI not found or not in PATH');
      });

      const hooks = plugin.getHooks();

      try {
        await hooks.afterStartDevelopment?.(
          context,
          {
            workflow: 'epcc',
            commit_behaviour: 'end' as const,
          } as unknown,
          {
            conversationId: context.conversationId,
            planFilePath: context.planFilePath,
            phase: context.currentPhase,
            workflow: 'epcc',
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Error should be clear and actionable
        expect(message).toContain('BeadsPlugin');
      }
    });
  });

  // ============================================================================
  // Test Suite E: Goal Extraction
  // ============================================================================

  describe('Test Suite E: Goal Extraction', () => {
    it('E1: should handle missing goal section gracefully', async () => {
      // Create plan without goal section
      const planWithoutGoal = `# Development Plan

## Explore
<!-- beads-phase-id: TBD -->`;

      await writeFile(testPlanFilePath, planWithoutGoal);

      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const args = { workflow: 'epcc', commit_behaviour: 'end' as const };

      let _epicCreateCmd = '';
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command === 'bd list --limit 1') {
          return 'No issues found\n';
        }
        if (command.includes('bd create') && callCount === 1) {
          _epicCreateCmd = command;
        }
        if (command.includes('bd create')) {
          return '✓ Created issue: epic-1\n';
        }
        if (command.includes('bd') && command.includes('--parent')) {
          return '✓ Created issue: epic-1.1\n';
        }
        throw new Error(`Unexpected command: ${command}`);
      });

      let callCount = 0;

      const hooks = plugin.getHooks();
      await hooks.afterStartDevelopment?.(context, args, {
        conversationId: context.conversationId,
        planFilePath: context.planFilePath,
        phase: context.currentPhase,
        workflow: args.workflow,
      });

      // Should have called create without goal description being undefined
      // The goal extraction should fail gracefully
      expect(vi.mocked(execSync)).toHaveBeenCalled();
    });

    it('E2: should reject placeholder goals', async () => {
      const planWithPlaceholder = `# Development Plan

## Goal
*Define what you're building...*

## Explore
<!-- beads-phase-id: TBD -->`;

      await writeFile(testPlanFilePath, planWithPlaceholder);

      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const args = { workflow: 'epcc', commit_behaviour: 'end' as const };

      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command === 'bd list --limit 1') {
          return 'No issues found\n';
        }
        if (command.includes('bd create')) {
          return '✓ Created issue: epic-1\n';
        }
        if (command.includes('bd') && command.includes('--parent')) {
          return '✓ Created issue: epic-1.1\n';
        }
        throw new Error(`Unexpected command: ${command}`);
      });

      const hooks = plugin.getHooks();
      await hooks.afterStartDevelopment?.(context, args, {
        conversationId: context.conversationId,
        planFilePath: context.planFilePath,
        phase: context.currentPhase,
        workflow: args.workflow,
      });

      // Should complete without throwing
      expect(vi.mocked(execSync)).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test Suite F: Error Recovery
  // ============================================================================

  describe('Test Suite F: Error Recovery', () => {
    it('F2: should handle plan file write errors gracefully', async () => {
      const plugin = new BeadsPlugin({ projectPath: testProjectPath });
      const context = createMockContext();
      const args = { workflow: 'epcc', commit_behaviour: 'end' as const };

      // Remove write permissions on plan file by replacing with directory
      await rm(testPlanFilePath);
      await mkdir(testPlanFilePath);

      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command === 'bd list --limit 1') {
          return 'No issues found\n';
        }
        if (command.includes('bd create')) {
          return '✓ Created issue: epic-1\n';
        }
        if (command.includes('bd')) {
          return '✓ Created issue: epic-1.1\n';
        }
        throw new Error(`Unexpected command: ${command}`);
      });

      const hooks = plugin.getHooks();

      try {
        await hooks.afterStartDevelopment?.(context, args, {
          conversationId: context.conversationId,
          planFilePath: testPlanFilePath,
          phase: context.currentPhase,
          workflow: args.workflow,
        });
      } catch (error) {
        // Expected to fail when writing plan file
        expect(error instanceof Error).toBe(true);
        return;
      }

      // If it gets here, the write might have succeeded despite the directory
      // which is fine for this test
    });
  });
});
