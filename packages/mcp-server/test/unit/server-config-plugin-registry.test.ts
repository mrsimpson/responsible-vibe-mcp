/**
 * Test plugin registration in server-config
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initializeServerComponents } from '../../src/server-config.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Server Config Plugin Registration', () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), 'server-config-test-'));
  });

  afterEach(async () => {
    vi.clearAllMocks();
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should register BeadsPlugin when TASK_BACKEND is beads', async () => {
    vi.stubEnv('TASK_BACKEND', 'beads');

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

  it('should not register BeadsPlugin when TASK_BACKEND is not beads', async () => {
    vi.stubEnv('TASK_BACKEND', 'none');

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

  it('should initialize empty plugin registry by default', async () => {
    // Don't set TASK_BACKEND environment variable
    vi.unstubAllEnvs();

    const components = await initializeServerComponents({
      projectPath: tempDir,
    });

    expect(components.context.pluginRegistry).toBeDefined();
    expect(components.context.pluginRegistry.getPluginNames()).toHaveLength(0);
    expect(components.context.pluginRegistry.getEnabledPlugins()).toHaveLength(
      0
    );
  });
});
