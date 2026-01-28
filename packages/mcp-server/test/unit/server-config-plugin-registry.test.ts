/**
 * Test plugin registration in server-config
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initializeServerComponents } from '../../src/server-config.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

// Mock child_process to control bd command availability
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('Server Config Plugin Registration', () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.resetAllMocks(); // Reset mock implementations, not just call history
    tempDir = await mkdtemp(join(tmpdir(), 'server-config-test-'));
  });

  afterEach(async () => {
    vi.resetAllMocks();
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should register BeadsPlugin when TASK_BACKEND is beads and bd is available', async () => {
    vi.stubEnv('TASK_BACKEND', 'beads');

    // Mock bd --version to return success
    vi.mocked(execSync).mockReturnValue('beads v1.0.0\n');

    const components = await initializeServerComponents({
      projectPath: tempDir,
    });

    expect(components.context.pluginRegistry).toBeDefined();

    // Check that BeadsPlugin was registered
    const pluginNames = components.context.pluginRegistry.getPluginNames();
    expect(pluginNames).toContain('BeadsPlugin');

    // Check that it's enabled
    const enabledPlugins =
      components.context.pluginRegistry.getEnabledPlugins();
    expect(enabledPlugins).toHaveLength(1);
    expect(enabledPlugins[0].getName()).toBe('BeadsPlugin');
  });

  it('should not register BeadsPlugin when TASK_BACKEND is markdown', async () => {
    // Explicitly set markdown to disable beads
    vi.stubEnv('TASK_BACKEND', 'markdown');

    const components = await initializeServerComponents({
      projectPath: tempDir,
    });

    expect(components.context.pluginRegistry).toBeDefined();

    // Check that no plugins are registered
    const pluginNames = components.context.pluginRegistry.getPluginNames();
    expect(pluginNames).toHaveLength(0);

    // Check that no plugins are enabled
    const enabledPlugins =
      components.context.pluginRegistry.getEnabledPlugins();
    expect(enabledPlugins).toHaveLength(0);
  });

  it('should not register BeadsPlugin when bd is not available', async () => {
    // Explicitly clear TASK_BACKEND - triggers auto-detection
    delete process.env.TASK_BACKEND;

    // Mock bd --version to throw (command not found)
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('command not found: bd');
    });

    const components = await initializeServerComponents({
      projectPath: tempDir,
    });

    expect(components.context.pluginRegistry).toBeDefined();
    expect(components.context.pluginRegistry.getPluginNames()).toHaveLength(0);
    expect(components.context.pluginRegistry.getEnabledPlugins()).toHaveLength(
      0
    );
  });

  // Note: Auto-detection tests are covered in E2E tests (beads-plugin-integration.test.ts)
  // because mocking child_process across package boundaries requires E2E-style server setup
});
