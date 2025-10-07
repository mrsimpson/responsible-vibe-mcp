/**
 * Unit tests for project path configuration
 *
 * Tests the environment variable support and projectPath parameter in tools
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { createResponsibleVibeMCPServer } from '../../packages/mcp-server/src/server.js';

// Mock the logger to prevent console noise during tests
vi.mock('@responsible-vibe/core', async () => {
  const actual = await vi.importActual('@responsible-vibe/core');
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
    setMcpServerForLogging: vi.fn(),
  };
});

describe('Project Path Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables to clean state
    process.env = { ...originalEnv };
    delete process.env.PROJECT_PATH;
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  describe('Environment Variable Support', () => {
    it('should use PROJECT_PATH when provided', async () => {
      // Create temporary directory for test
      const tempDir = await fs.mkdtemp('/tmp/test-custom-');
      const testProjectPath = tempDir;
      process.env.PROJECT_PATH = testProjectPath;

      // Create server instance
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Verify the project path was used - check the effective project path
      const projectPath = server.getProjectPath();
      expect(projectPath).toBe(testProjectPath);

      // Clean up
      await server.cleanup();
    });

    it('should use config projectPath over environment variable', async () => {
      // Create temporary directories for test
      const envTempDir = await fs.mkdtemp('/tmp/test-env-');
      const configTempDir = await fs.mkdtemp('/tmp/test-config-');

      // Set environment variable
      process.env.PROJECT_PATH = envTempDir;

      // Create server with explicit config
      const configProjectPath = configTempDir;
      const server = await createResponsibleVibeMCPServer({
        projectPath: configProjectPath,
      });
      await server.initialize();

      // Verify config takes precedence over environment variable
      const projectPath = server.getProjectPath();
      expect(projectPath).toBe(configProjectPath);

      // Clean up
      await server.cleanup();
    });

    it('should fall back to process.cwd() when no project path is provided', async () => {
      // Ensure no environment variable is set
      delete process.env.PROJECT_PATH;

      // Create server without project path
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Verify fallback to process.cwd()
      const projectPath = server.getProjectPath();
      expect(projectPath).toBe(process.cwd());

      // Clean up
      await server.cleanup();
    });
  });

  describe('Integration Tests', () => {
    it('should properly pass environment variable through server initialization', async () => {
      // Create temporary directory for test
      const tempDir = await fs.mkdtemp('/tmp/test-integration-');
      const testProjectPath = tempDir;
      process.env.PROJECT_PATH = testProjectPath;

      // Create and initialize server
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Verify server initialization succeeded with correct project path
      expect(server.getProjectPath()).toBe(testProjectPath);

      // Test that the server uses the custom path for operations
      // Use 'minor' workflow which doesn't require project documentation
      const result = await server.handleStartDevelopment({
        workflow: 'minor', // use a workflow that doesn't require project docs, else it would fail
        commit_behaviour: 'none',
      });

      // Verify the custom project path was used in the plan file path
      expect(result.plan_file_path).toBeTruthy();
      expect(result.plan_file_path).toContain(testProjectPath);

      // Clean up
      await server.cleanup();
    });

    it('should load custom workflows from PROJECT_PATH + /.vibe when environment variable is set', async () => {
      // Store original environment variable
      const originalProjectPath = process.env.PROJECT_PATH;

      // Create a temporary directory structure for testing
      const tempDir = '/tmp/test-custom-workflow-' + Date.now();
      const vibeDir = `${tempDir}/.vibe/workflows`;

      try {
        // Create test directory structure
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(vibeDir, { recursive: true });

        // Create a custom workflow file with proper naming
        await fs.writeFile(
          `${vibeDir}/custom.yaml`,
          `---
name: 'custom'
description: 'Custom Test Workflow for testing PROJECT_PATH environment variable'
initial_state: 'start'

states:
  start:
    description: 'Starting phase for custom workflow'
    default_instructions: 'This is the start phase of the custom workflow for testing PROJECT_PATH environment variable support.'
    transitions:
      - trigger: 'start_complete'
        to: 'middle'
        transition_reason: 'Start phase completed'
  middle:
    description: 'Middle phase for custom workflow'
    default_instructions: 'This is the middle phase of the custom workflow.'
    transitions:
      - trigger: 'middle_complete'
        to: 'end'
        transition_reason: 'Middle phase completed'
  end:
    description: 'Final phase for custom workflow'
    default_instructions: 'This is the final phase of the custom workflow.'
    transitions: []
`
        );

        // Set PROJECT_PATH environment variable
        process.env.PROJECT_PATH = tempDir;

        // Create and initialize server (this should pick up the new env var)
        const server = await createResponsibleVibeMCPServer();
        await server.initialize();

        // Verify the server uses the custom project path
        expect(server.getProjectPath()).toBe(tempDir);

        // Test that custom workflow can be loaded
        const result = await server.handleStartDevelopment({
          workflow: 'custom',
          commit_behaviour: 'none',
        });

        // Verify the custom workflow was loaded and used
        expect(result).toHaveProperty('phase');
        expect(result).toHaveProperty('instructions');
        expect(result).toHaveProperty('conversation_id');
        expect(result).toHaveProperty('plan_file_path');

        // The key test: verify that the server is using the correct project path
        // This proves that PROJECT_PATH environment variable is working
        expect(server.getProjectPath()).toBe(tempDir);

        // Clean up
        await server.cleanup();
      } finally {
        // Restore original environment variable
        if (originalProjectPath !== undefined) {
          process.env.PROJECT_PATH = originalProjectPath;
        } else {
          delete process.env.PROJECT_PATH;
        }

        // Clean up test files
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});
