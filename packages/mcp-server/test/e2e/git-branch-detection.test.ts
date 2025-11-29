/**
 * Git Branch Detection Tests
 *
 * Tests that verify the system correctly detects and uses git branch names
 * for plan file naming, especially on first conversation.
 *
 * Related to issue #161: First conversation ignores git repo
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  TempProject,
  createTempProjectWithDefaultStateMachine,
} from '../utils/temp-files';
import {
  DirectServerInterface,
  createSuiteIsolatedE2EScenario,
  assertToolSuccess,
} from '../utils/e2e-test-setup';
import { execSync } from 'node:child_process';
import path from 'node:path';

describe('Git Branch Detection', () => {
  let client: DirectServerInterface;
  let cleanup: () => Promise<void>;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Plan File Naming Based on Branch', () => {
    it('should use branch name in plan file when on feature branch (not default)', async () => {
      // Create a temp project on a feature branch
      const scenario = await createSuiteIsolatedE2EScenario({
        suiteName: 'git-branch-feature',
        tempProjectFactory: baseDir => {
          // Create project with a feature branch
          const project = new TempProject({
            projectName: `feature-branch-test-${Date.now()}`,
            gitBranch: 'feature/awesome-feature',
            baseDirectory: baseDir,
          });

          // Remove the fake .git directory created by TempProject
          // so we can create a real git repository
          const { rmSync } = require('node:fs');
          const gitPath = path.join(project.projectPath, '.git');
          rmSync(gitPath, { recursive: true, force: true });

          // Initialize it as a real git repository so git commands work
          try {
            execSync('git init', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git config user.email "test@example.com"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git config user.name "Test User"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git checkout -b feature/awesome-feature', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            // Make an initial commit so HEAD exists
            execSync(
              'git commit --allow-empty --no-gpg-sign -m "Initial commit"',
              {
                cwd: project.projectPath,
                stdio: 'pipe',
              }
            );

            // Verify the branch was created successfully
            const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
              cwd: project.projectPath,
              encoding: 'utf-8',
              stdio: 'pipe',
            }).trim();
            console.log('Git repo initialized. Current branch:', currentBranch);
          } catch (error) {
            console.error('Failed to initialize git repo for test:', error);
            throw error;
          }

          // Add mock project documents
          project.addMockProjectDocs();
          return project;
        },
      });

      client = scenario.client;
      cleanup = scenario.cleanup;

      // Start development on the feature branch
      const result = await client.callTool('start_development', {
        workflow: 'waterfall',
        commit_behaviour: 'none',
      });

      const response = assertToolSuccess(result);

      // The plan file should include the branch name, NOT "default"
      expect(response.plan_file_path).toBeTruthy();
      expect(response.plan_file_path).toContain('feature-awesome-feature');
      expect(response.plan_file_path).not.toContain(
        'development-plan-default.md'
      );

      console.log('Plan file path:', response.plan_file_path);
    });

    it('should use "default" in plan file name when not in a git repository', async () => {
      // Create a temp project WITHOUT git initialization
      const scenario = await createSuiteIsolatedE2EScenario({
        suiteName: 'no-git-repo',
        tempProjectFactory: baseDir => {
          const project = createTempProjectWithDefaultStateMachine(baseDir);
          // Don't create .git directory at all
          const gitPath = path.join(project.projectPath, '.git');
          const { rmSync, existsSync } = require('node:fs');
          if (existsSync(gitPath)) {
            rmSync(gitPath, { recursive: true, force: true });
          }
          return project;
        },
      });

      client = scenario.client;
      cleanup = scenario.cleanup;

      const result = await client.callTool('start_development', {
        workflow: 'waterfall',
        commit_behaviour: 'none',
      });

      const response = assertToolSuccess(result);

      // When not a git repo, should use "default"
      expect(response.plan_file_path).toContain('development-plan-default.md');
    });

    it('should use different plan files for different branches', async () => {
      // Create a temp project on branch1
      const scenario1 = await createSuiteIsolatedE2EScenario({
        suiteName: 'git-branch-1',
        tempProjectFactory: baseDir => {
          const project = new TempProject({
            projectName: `multi-branch-test-${Date.now()}`,
            gitBranch: 'feature/branch-1',
            baseDirectory: baseDir,
          });

          // Remove fake .git directory and initialize real git repo
          const { rmSync } = require('node:fs');
          const gitPath = path.join(project.projectPath, '.git');
          rmSync(gitPath, { recursive: true, force: true });

          try {
            execSync('git init', { cwd: project.projectPath, stdio: 'pipe' });
            execSync('git config user.email "test@example.com"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git config user.name "Test User"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git checkout -b feature/branch-1', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync(
              'git commit --allow-empty --no-gpg-sign -m "Initial commit"',
              {
                cwd: project.projectPath,
                stdio: 'pipe',
              }
            );
          } catch (error) {
            console.error('Failed to initialize git repo:', error);
            throw error;
          }

          project.addMockProjectDocs();
          return project;
        },
      });

      const client1 = scenario1.client;
      const cleanup1 = scenario1.cleanup;

      const result1 = await client1.callTool('start_development', {
        workflow: 'waterfall',
        commit_behaviour: 'none',
      });

      const response1 = assertToolSuccess(result1);

      // Should contain branch-1
      expect(response1.plan_file_path).toContain('branch-1');
      expect(response1.plan_file_path).not.toContain('branch-2');

      await cleanup1();

      // Create a temp project on branch2 with same project name
      const scenario2 = await createSuiteIsolatedE2EScenario({
        suiteName: 'git-branch-2',
        tempProjectFactory: baseDir => {
          const project = new TempProject({
            projectName: `multi-branch-test-${Date.now()}`,
            gitBranch: 'feature/branch-2',
            baseDirectory: baseDir,
          });

          // Remove fake .git directory and initialize real git repo
          const { rmSync } = require('node:fs');
          const gitPath2 = path.join(project.projectPath, '.git');
          rmSync(gitPath2, { recursive: true, force: true });

          try {
            execSync('git init', { cwd: project.projectPath, stdio: 'pipe' });
            execSync('git config user.email "test@example.com"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git config user.name "Test User"', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync('git checkout -b feature/branch-2', {
              cwd: project.projectPath,
              stdio: 'pipe',
            });
            execSync(
              'git commit --allow-empty --no-gpg-sign -m "Initial commit"',
              {
                cwd: project.projectPath,
                stdio: 'pipe',
              }
            );
          } catch (error) {
            console.error('Failed to initialize git repo:', error);
            throw error;
          }

          project.addMockProjectDocs();
          return project;
        },
      });

      const client2 = scenario2.client;
      const cleanup2 = scenario2.cleanup;

      const result2 = await client2.callTool('start_development', {
        workflow: 'waterfall',
        commit_behaviour: 'none',
      });

      const response2 = assertToolSuccess(result2);

      // Should contain branch-2
      expect(response2.plan_file_path).toContain('branch-2');
      expect(response2.plan_file_path).not.toContain('branch-1');

      await cleanup2();
    });
  });
});
