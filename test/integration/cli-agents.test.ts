/**
 * CLI Agents Commands Tests
 *
 * Tests for CLI commands that manage agent configurations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('CLI Agents Commands', () => {
  let tempDir: string;
  const cliPath = join(process.cwd(), 'packages/cli/dist/index.js');

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cli-agents-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('agents list', () => {
    it('should list available agent configurations', () => {
      const output = execSync(`node ${cliPath} agents list`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('Available agent configurations');
      expect(output).toContain('architect');
      expect(output).toContain('business-analyst');
      expect(output).toContain('developer');
      expect(output).toContain('Software Architect');
      expect(output).toContain('Business Analyst');
      expect(output).toContain('Software Developer');
    });

    it('should suggest using agents copy command', () => {
      const output = execSync(`node ${cliPath} agents list`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('agents copy');
    });
  });

  describe('agents copy', () => {
    it('should copy agents to default .crowd/agents/ directory', () => {
      execSync(`node ${cliPath} agents copy`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      const agentsDir = join(tempDir, '.crowd', 'agents');
      expect(existsSync(agentsDir)).toBe(true);

      const files = readdirSync(agentsDir);
      expect(files).toContain('architect.yaml');
      expect(files).toContain('business-analyst.yaml');
      expect(files).toContain('developer.yaml');
      expect(files.length).toBe(3);
    });

    it('should copy agents with correct content', () => {
      execSync(`node ${cliPath} agents copy`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      const agentPath = join(
        tempDir,
        '.crowd',
        'agents',
        'business-analyst.yaml'
      );
      const content = readFileSync(agentPath, 'utf-8');

      expect(content).toContain('name: business-analyst');
      expect(content).toContain('displayName: Business Analyst');
      expect(content).toContain('VIBE_ROLE: business-analyst');
      expect(content).toContain('VIBE_WORKFLOW_DOMAINS: sdd-crowd');
      expect(content).toContain('responsible-vibe-mcp@latest');
    });

    it('should copy agents to custom output directory', () => {
      const customDir = join(tempDir, 'custom-agents');

      execSync(`node ${cliPath} agents copy --output-dir ${customDir}`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(existsSync(customDir)).toBe(true);
      const files = readdirSync(customDir);
      expect(files.length).toBe(3);
    });

    it('should skip existing files', () => {
      // First copy
      execSync(`node ${cliPath} agents copy`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      // Second copy should skip
      const output = execSync(`node ${cliPath} agents copy`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('already exists, skipping');
      expect(output).toContain('skipped 3 existing');
    });

    it('should report successful copy', () => {
      const output = execSync(`node ${cliPath} agents copy`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('Copying 3 agent configuration');
      expect(output).toContain('✅ architect.yaml');
      expect(output).toContain('✅ business-analyst.yaml');
      expect(output).toContain('✅ developer.yaml');
      expect(output).toContain('Copied 3 agent configuration');
    });

    it('should create target directory if it does not exist', () => {
      const nestedDir = join(tempDir, 'deeply', 'nested', 'dir');

      execSync(`node ${cliPath} agents copy --output-dir ${nestedDir}`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(existsSync(nestedDir)).toBe(true);
      const files = readdirSync(nestedDir);
      expect(files.length).toBe(3);
    });
  });

  describe('agents help', () => {
    it('should show agents commands in help text', () => {
      const output = execSync(`node ${cliPath} --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('AGENTS COMMANDS');
      expect(output).toContain('agents list');
      expect(output).toContain('agents copy');
      expect(output).toContain('List available agent configurations');
      expect(output).toContain('Copy agent configs to .crowd/agents/');
    });
  });
});
