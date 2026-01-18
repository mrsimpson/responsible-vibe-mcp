/**
 * Integration Test: Beads TBD Replacement
 *
 * Validates that beads phase task IDs are properly replaced in plan files
 * during start_development() flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

import { createResponsibleVibeMCPServer } from '../../packages/mcp-server/src/server-implementation.js';

// Mock child_process for beads commands
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('Beads TBD Replacement Integration', () => {
  let testProjectPath: string;
  let server: Awaited<ReturnType<typeof createResponsibleVibeMCPServer>>;

  beforeEach(async () => {
    // Create temporary test project
    testProjectPath = join(tmpdir(), `beads-test-${Date.now()}`);
    await mkdir(testProjectPath, { recursive: true });

    // Initialize as git repository
    await writeFile(
      join(testProjectPath, '.git', 'config'),
      '[core]\n  repositoryformatversion = 0\n'
    );

    // Set up beads environment
    process.env.TASK_BACKEND = 'beads';

    // Mock beads version check (for backend detection)
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === 'bd --version') {
        return 'beads v1.0.0\n';
      }

      // Mock epic creation
      if (
        command.includes('bd create') &&
        command.includes('Responsible-Vibe Development')
      ) {
        return '✓ Created issue: project-epic-123\n';
      }

      // Mock phase task creation
      if (
        command.includes('bd create') &&
        command.includes('--parent project-epic-123')
      ) {
        if (command.includes('"Explore"')) {
          return '✓ Created issue: project-explore-456\n';
        }
        if (command.includes('"Plan"')) {
          return '✓ Created issue: project-plan-789\n';
        }
        if (command.includes('"Code"')) {
          return '✓ Created issue: project-code-012\n';
        }
        if (command.includes('"Commit"')) {
          return '✓ Created issue: project-commit-345\n';
        }
      }

      // Mock git commands
      if (command === 'git symbolic-ref --short HEAD') {
        return 'feature/test\n';
      }

      throw new Error(`Unexpected command: ${command}`);
    });

    // Create server instance
    server = await createResponsibleVibeMCPServer({
      projectPath: testProjectPath,
    });
    await server.initialize();
  });

  afterEach(async () => {
    await server.cleanup();

    // Clean up test project
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true, force: true });
    }

    // Reset environment
    delete process.env.TASK_BACKEND;
    vi.clearAllMocks();
  });

  it('should replace all TBD placeholders with actual beads task IDs', async () => {
    // Start development with epcc workflow
    const result = await server.handleStartDevelopment({
      workflow: 'epcc',
      project_path: testProjectPath,
      commit_behaviour: 'none',
    });

    expect(result.phase).toBe('explore');
    expect(result.plan_file_path).toBeTruthy();

    // Read the generated plan file
    const planContent = await readFile(result.plan_file_path, 'utf-8');

    // Verify no TBD placeholders remain
    const tbdMatches = planContent.match(/<!-- beads-phase-id: TBD -->/g);
    expect(tbdMatches).toBeNull();

    // Verify actual task IDs are present
    expect(planContent).toContain(
      '<!-- beads-phase-id: project-explore-456 -->'
    );
    expect(planContent).toContain('<!-- beads-phase-id: project-plan-789 -->');
    expect(planContent).toContain('<!-- beads-phase-id: project-code-012 -->');
    expect(planContent).toContain(
      '<!-- beads-phase-id: project-commit-345 -->'
    );

    // Verify proper placement (task IDs should be under correct phase headers)
    const exploreSection = planContent.match(
      /## Explore\s*\n<!-- beads-phase-id: project-explore-456 -->/
    );
    expect(exploreSection).toBeTruthy();

    const planSection = planContent.match(
      /## Plan\s*\n<!-- beads-phase-id: project-plan-789 -->/
    );
    expect(planSection).toBeTruthy();

    const codeSection = planContent.match(
      /## Code\s*\n<!-- beads-phase-id: project-code-012 -->/
    );
    expect(codeSection).toBeTruthy();

    const commitSection = planContent.match(
      /## Commit\s*\n<!-- beads-phase-id: project-commit-345 -->/
    );
    expect(commitSection).toBeTruthy();
  });

  it('should handle beads command failures gracefully without breaking development start', async () => {
    // Mock beads epic creation failure
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === 'bd --version') {
        return 'beads v1.0.0\n';
      }

      if (
        command.includes('bd create') &&
        command.includes('Responsible-Vibe Development')
      ) {
        throw new Error('beads connection failed');
      }

      if (command === 'git symbolic-ref --short HEAD') {
        return 'feature/test\n';
      }

      throw new Error(`Unexpected command: ${command}`);
    });

    // start_development should throw because beads setup fails
    await expect(
      server.handleStartDevelopment({
        workflow: 'epcc',
        project_path: testProjectPath,
        commit_behaviour: 'none',
      })
    ).rejects.toThrow('Failed to setup beads integration');
  });

  it('should handle TBD replacement failures gracefully', async () => {
    // Mock successful beads commands but invalid task IDs
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === 'bd --version') {
        return 'beads v1.0.0\n';
      }

      if (command.includes('bd create')) {
        // Return invalid response that won't match ID extraction regex
        return 'Something went wrong but command succeeded\n';
      }

      if (command === 'git symbolic-ref --short HEAD') {
        return 'feature/test\n';
      }

      throw new Error(`Unexpected command: ${command}`);
    });

    // This should still complete, but TBD replacement will fail silently
    const result = await server.handleStartDevelopment({
      workflow: 'epcc',
      project_path: testProjectPath,
      commit_behaviour: 'none',
    });

    expect(result.phase).toBe('explore');

    // Read plan file - should still have TBD placeholders due to ID extraction failure
    const planContent = await readFile(result.plan_file_path, 'utf-8');
    const tbdMatches = planContent.match(/<!-- beads-phase-id: TBD -->/g);

    // Since beads tasks couldn't be created properly, TBDs should remain
    // (This tests the silent failure path in updatePlanFileWithPhaseTaskIds)
    expect(tbdMatches).toBeTruthy();
    expect(tbdMatches?.length).toBeGreaterThan(0);
  });

  it('should work with different workflow phase structures', async () => {
    // Test with a different workflow that has different phases
    const result = await server.handleStartDevelopment({
      workflow: 'minor', // Has explore and implement phases
      project_path: testProjectPath,
      commit_behaviour: 'none',
    });

    const planContent = await readFile(result.plan_file_path, 'utf-8');

    // Should have no TBD placeholders regardless of workflow
    const tbdMatches = planContent.match(/<!-- beads-phase-id: TBD -->/g);
    expect(tbdMatches).toBeNull();
  });

  it('should validate beads CLI is available before attempting setup', async () => {
    // Mock beads as unavailable
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === 'bd --version') {
        throw new Error('command not found: bd');
      }

      if (command === 'git symbolic-ref --short HEAD') {
        return 'feature/test\n';
      }

      throw new Error(`Unexpected command: ${command}`);
    });

    // Should throw because beads validation fails
    await expect(
      server.handleStartDevelopment({
        workflow: 'epcc',
        project_path: testProjectPath,
        commit_behaviour: 'none',
      })
    ).rejects.toThrow();
  });
});
