/**
 * Integration test for CommitPlugin end-to-end behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeServerComponents } from '../../src/server-config.js';

describe('CommitPlugin Integration', () => {
  const testDir = resolve(__dirname, 'test-commit-plugin');
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      COMMIT_BEHAVIOR: process.env.COMMIT_BEHAVIOR,
      COMMIT_MESSAGE_TEMPLATE: process.env.COMMIT_MESSAGE_TEMPLATE,
    };

    // Clean up any existing test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Create test git repository
    mkdirSync(testDir, { recursive: true });
    execSync('git init', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
    execSync('git config user.email "test@example.com"', { cwd: testDir });

    // Create initial commit
    writeFileSync(resolve(testDir, 'README.md'), '# Test Project\n');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Initial commit"', { cwd: testDir });
  });

  afterEach(() => {
    // Restore original environment
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should register CommitPlugin when COMMIT_BEHAVIOR is set', async () => {
    // Arrange
    process.env.COMMIT_BEHAVIOR = 'step';

    // Act
    const components = await initializeServerComponents({
      projectPath: testDir,
    });

    // Assert
    expect(components.context.pluginRegistry).toBeDefined();
    const plugins = components.context.pluginRegistry.getEnabledPlugins();
    const commitPlugin = plugins.find(p => p.getName() === 'CommitPlugin');
    expect(commitPlugin).toBeDefined();
    expect(commitPlugin?.getSequence()).toBe(50);
  });

  it('should not register CommitPlugin when COMMIT_BEHAVIOR is not set', async () => {
    // Arrange - no COMMIT_BEHAVIOR set

    // Act
    const components = await initializeServerComponents({
      projectPath: testDir,
    });

    // Assert
    const plugins = components.context.pluginRegistry.getEnabledPlugins();
    const commitPlugin = plugins.find(p => p.getName() === 'CommitPlugin');
    expect(commitPlugin).toBeUndefined();
  });

  it('should add final commit task to plan file when COMMIT_BEHAVIOR=end', async () => {
    // Arrange
    process.env.COMMIT_BEHAVIOR = 'end';
    process.env.COMMIT_MESSAGE_TEMPLATE = 'feat: test complete';

    // Act
    const components = await initializeServerComponents({
      projectPath: testDir,
    });

    // Create a mock plan file content
    const mockPlanContent = `# Test Plan

## Explore
### Tasks
- [ ] Research the problem

## Code  
### Tasks
- [ ] Implement solution

## Commit
### Tasks
- [ ] Review implementation
`;

    // Execute the afterPlanFileCreated hook
    const plugins = components.context.pluginRegistry.getEnabledPlugins();
    const commitPlugin = plugins.find(p => p.getName() === 'CommitPlugin');
    const hooks = commitPlugin?.getHooks();

    if (hooks?.afterPlanFileCreated) {
      const mockContext = {
        conversationId: 'test',
        planFilePath: resolve(testDir, 'plan.md'),
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath: testDir,
        gitBranch: 'main',
      };

      const updatedContent = await hooks.afterPlanFileCreated(
        mockContext,
        resolve(testDir, 'plan.md'),
        mockPlanContent
      );

      // Assert
      expect(updatedContent).toContain('Create a conventional commit');
      expect(updatedContent).toContain(
        'summarize the intentions and key decisions'
      );
      expect(updatedContent).toContain('feat: test complete');
    }
  });

  it('should add squash commit task for step/phase modes', async () => {
    // Arrange
    process.env.COMMIT_BEHAVIOR = 'step';

    // Act
    const components = await initializeServerComponents({
      projectPath: testDir,
    });

    const mockPlanContent = `## Commit
### Tasks
- [ ] Review implementation
`;

    const plugins = components.context.pluginRegistry.getEnabledPlugins();
    const commitPlugin = plugins.find(p => p.getName() === 'CommitPlugin');
    const hooks = commitPlugin?.getHooks();

    if (hooks?.afterPlanFileCreated) {
      const mockContext = {
        conversationId: 'test',
        planFilePath: resolve(testDir, 'plan.md'),
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath: testDir,
        gitBranch: 'main',
      };

      const updatedContent = await hooks.afterPlanFileCreated(
        mockContext,
        resolve(testDir, 'plan.md'),
        mockPlanContent
      );

      // Assert
      expect(updatedContent).toContain('Squash WIP commits:');
      expect(updatedContent).toContain('git reset --soft');
    }
  });

  it('should create WIP commit on phase transition', async () => {
    // Arrange
    process.env.COMMIT_BEHAVIOR = 'phase';

    // Create some changes
    writeFileSync(resolve(testDir, 'test.txt'), 'test content');

    // Act
    const components = await initializeServerComponents({
      projectPath: testDir,
    });

    const plugins = components.context.pluginRegistry.getEnabledPlugins();
    const commitPlugin = plugins.find(p => p.getName() === 'CommitPlugin');
    const hooks = commitPlugin?.getHooks();

    if (hooks?.beforePhaseTransition) {
      const mockContext = {
        conversationId: 'test',
        planFilePath: resolve(testDir, 'plan.md'),
        currentPhase: 'explore',
        workflow: 'epcc',
        projectPath: testDir,
        gitBranch: 'main',
        targetPhase: 'plan',
      };

      await hooks.beforePhaseTransition(mockContext, 'explore', 'plan');

      // Assert - check git log for WIP commit
      const gitLog = execSync('git log --oneline', {
        cwd: testDir,
        encoding: 'utf-8',
      });
      expect(gitLog).toContain('WIP: transition to plan');
    }
  });
});
