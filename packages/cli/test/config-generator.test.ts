import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Config Generator', () => {
  let tempDir: string;
  let generateConfig: (agent: string, outputDir: string) => Promise<void>;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'config-generator-test-'));

    // Import from source
    const module = await import('../src/config-generator.js');
    generateConfig = module.generateConfig;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Amazon Q Configuration', () => {
    it('should generate Amazon Q configuration file', async () => {
      await generateConfig('amazonq-cli', tempDir);

      const configPath = join(tempDir, '.amazonq', 'cli-agents', 'vibe.json');
      expect(existsSync(configPath)).toBe(true);

      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(config.name).toBe('vibe');
      expect(config.description).toBe('Responsible vibe development');
      expect(config.mcpServers).toBeDefined();
      expect(config.tools).toContain('@responsible-vibe-mcp');
      expect(config.allowedTools).toContain('@responsible-vibe-mcp/whats_next');
    });
  });

  describe('Claude Configuration', () => {
    it('should generate Claude configuration files', async () => {
      await generateConfig('claude', tempDir);

      // Check CLAUDE.md
      const claudeMdPath = join(tempDir, 'CLAUDE.md');
      expect(existsSync(claudeMdPath)).toBe(true);
      const claudeContent = readFileSync(claudeMdPath, 'utf-8');
      expect(claudeContent).toContain('responsible-vibe-mcp');

      // Check .mcp.json
      const mcpJsonPath = join(tempDir, '.mcp.json');
      expect(existsSync(mcpJsonPath)).toBe(true);
      const mcpConfig = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));
      expect(mcpConfig.mcpServers).toBeDefined();

      // Check settings.json
      const settingsPath = join(tempDir, 'settings.json');
      expect(existsSync(settingsPath)).toBe(true);
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      expect(settings.permissions.allow).toContain(
        'MCP(responsible-vibe-mcp:whats_next)'
      );
    });
  });

  describe('Gemini Configuration', () => {
    it('should generate Gemini configuration files', async () => {
      await generateConfig('gemini', tempDir);

      // Check settings.json
      const settingsPath = join(tempDir, 'settings.json');
      expect(existsSync(settingsPath)).toBe(true);
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      expect(settings.contextFileName).toBe('GEMINI.md');
      expect(settings.mcpServers).toBeDefined();

      // Check GEMINI.md
      const geminiMdPath = join(tempDir, 'GEMINI.md');
      expect(existsSync(geminiMdPath)).toBe(true);
      const geminiContent = readFileSync(geminiMdPath, 'utf-8');
      expect(geminiContent).toContain('Vibe Development Agent');
      expect(geminiContent).toContain('whats_next');
    });
  });

  describe('OpenCode Configuration', () => {
    it('should generate OpenCode configuration file', async () => {
      await generateConfig('opencode', tempDir);

      const configPath = join(tempDir, 'opencode.json');
      expect(existsSync(configPath)).toBe(true);

      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(config.mcp['responsible-vibe-mcp']).toBeDefined();
      expect(config.agent.vibe).toBeDefined();
      expect(config.agent.vibe.tools['responsible-vibe-mcp*']).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported agent', async () => {
      await expect(generateConfig('unsupported', tempDir)).rejects.toThrow(
        'Unsupported agent: unsupported'
      );
    });
  });
});
