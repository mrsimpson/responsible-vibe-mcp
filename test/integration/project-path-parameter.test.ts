/**
 * Integration tests for project_path parameter in start_development tool
 *
 * Tests the new project_path parameter functionality that allows explicit
 * control over where .vibe folders are created, addressing the working
 * directory issue with global MCP configurations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { createResponsibleVibeMCPServer } from '../../packages/mcp-server/src/server.js';

// Mock the logger to prevent console noise during tests
vi.mock('@codemcp/workflows-core', async () => {
  const actual = await vi.importActual('@codemcp/workflows-core');
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

describe('Project Path Parameter', () => {
  const originalEnv = process.env;
  let tempDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.PROJECT_PATH;
    tempDirs = [];
  });

  afterEach(async () => {
    vi.clearAllMocks();
    process.env = originalEnv;

    // Clean up all temporary directories
    for (const tempDir of tempDirs) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    tempDirs = [];
  });

  async function createTempDir(prefix: string): Promise<string> {
    const tempDir = await fs.mkdtemp(`/tmp/${prefix}-`);
    tempDirs.push(tempDir);
    return tempDir;
  }

  describe('Path Normalization', () => {
    it('should normalize project_path by stripping /.vibe suffix', async () => {
      const projectDir = await createTempDir('test-normalize');
      const vibeDir = join(projectDir, '.vibe');
      await fs.mkdir(vibeDir, { recursive: true });

      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Pass .vibe directory path - should be normalized to project root
      const result = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'none',
        project_path: vibeDir, // Pass .vibe directory
      });

      // Verify the plan file is created in the correct project directory
      expect(result.plan_file_path).toContain(projectDir);
      expect(result.plan_file_path).toContain('/.vibe/');

      // Verify the .vibe folder structure exists in project directory
      const expectedVibeDir = join(projectDir, '.vibe');
      const vibeExists = await fs
        .access(expectedVibeDir)
        .then(() => true)
        .catch(() => false);
      expect(vibeExists).toBe(true);

      await server.cleanup();
    });

    it('should use project_path directly when no /.vibe suffix present', async () => {
      const projectDir = await createTempDir('test-direct');

      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Pass project directory directly
      const result = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'none',
        project_path: projectDir,
      });

      // Verify the plan file is created in the specified project directory
      expect(result.plan_file_path).toContain(projectDir);
      expect(result.plan_file_path).toContain('/.vibe/');

      await server.cleanup();
    });
  });

  describe('External Directory Integration', () => {
    it('should create .vibe folder in external directory outside project hierarchy', async () => {
      // Create external directory completely outside project hierarchy
      const externalDir = await createTempDir('external-project');

      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Start development with external directory
      const startResult = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'none',
        project_path: externalDir,
      });

      // Verify conversation and plan file are created in external directory
      expect(startResult.plan_file_path).toContain(externalDir);
      expect(startResult.plan_file_path).toContain('/.vibe/');
      expect(startResult.conversation_id).toBeTruthy();

      // Verify .vibe directory structure exists
      const vibeDir = join(externalDir, '.vibe');
      const vibeExists = await fs
        .access(vibeDir)
        .then(() => true)
        .catch(() => false);
      expect(vibeExists).toBe(true);

      // Verify plan file exists
      const planFileExists = await fs
        .access(startResult.plan_file_path)
        .then(() => true)
        .catch(() => false);
      expect(planFileExists).toBe(true);

      // Note: conversations directory might not exist until first conversation is saved
      // This is expected behavior - the directory is created on-demand

      await server.cleanup();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without project_path parameter (existing behavior)', async () => {
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Call without project_path parameter
      const result = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'none',
        // No project_path parameter
      });

      // Should use default project path (process.cwd())
      expect(result.plan_file_path).toContain(process.cwd());
      expect(result.conversation_id).toBeTruthy();

      await server.cleanup();
    });

    it('should prioritize project_path over environment variable', async () => {
      const envDir = await createTempDir('env-dir');
      const paramDir = await createTempDir('param-dir');

      // Set environment variable
      process.env.PROJECT_PATH = envDir;

      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Call with explicit project_path parameter
      const result = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'none',
        project_path: paramDir,
      });

      // Should use project_path parameter, not environment variable
      expect(result.plan_file_path).toContain(paramDir);
      expect(result.plan_file_path).not.toContain(envDir);

      await server.cleanup();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project_path gracefully', async () => {
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Try with non-existent directory
      await expect(
        server.handleStartDevelopment({
          workflow: 'minor',
          commit_behaviour: 'none',
          project_path: '/non/existent/directory',
        })
      ).rejects.toThrow();

      await server.cleanup();
    });

    it('should handle project_path with insufficient permissions', async () => {
      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Try with root directory (should fail due to permissions)
      await expect(
        server.handleStartDevelopment({
          workflow: 'minor',
          commit_behaviour: 'none',
          project_path: '/root',
        })
      ).rejects.toThrow();

      await server.cleanup();
    });
  });

  describe('Git Integration', () => {
    it('should handle git operations in external directory', async () => {
      const externalDir = await createTempDir('external-git');

      // Initialize git repository in external directory
      const { execSync } = require('node:child_process');
      try {
        execSync('git init', { cwd: externalDir, stdio: 'ignore' });
        execSync('git config user.email "test@example.com"', {
          cwd: externalDir,
          stdio: 'ignore',
        });
        execSync('git config user.name "Test User"', {
          cwd: externalDir,
          stdio: 'ignore',
        });
      } catch (_error) {
        // Skip test if git is not available
        console.warn('Git not available, skipping git integration test');
        return;
      }

      const server = await createResponsibleVibeMCPServer();
      await server.initialize();

      // Start development with git commit behavior
      const result = await server.handleStartDevelopment({
        workflow: 'minor',
        commit_behaviour: 'end',
        project_path: externalDir,
      });

      // Check if the result indicates a branch prompt (expected on main/master)
      if (result.phase === 'branch-prompt') {
        // This is expected behavior - the tool prompts for branch creation
        expect(result.instructions).toContain('branch');
        await server.cleanup();
        return;
      }

      expect(result.conversation_id).toBeTruthy();
      expect(result.plan_file_path).toContain(externalDir);

      // Verify .vibe/.gitignore is created
      const gitignorePath = join(externalDir, '.vibe', '.gitignore');
      const gitignoreExists = await fs
        .access(gitignorePath)
        .then(() => true)
        .catch(() => false);
      expect(gitignoreExists).toBe(true);

      await server.cleanup();
    });
  });
});
