import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CLI', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let runCli: () => void;

  beforeEach(async () => {
    // Save original values
    originalArgv = process.argv;
    originalExit = process.exit;

    // Setup spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Import from source
    const module = await import('../src/cli.js');
    runCli = module.runCli;
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;

    // Restore spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Help Command', () => {
    it('should show help with --help flag', () => {
      process.argv = ['node', 'cli.js', '--help'];

      runCli();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Responsible Vibe CLI Tools')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('--generate-config <agent>')
      );
    });

    it('should show help with -h flag', () => {
      process.argv = ['node', 'cli.js', '-h'];

      runCli();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Responsible Vibe CLI Tools')
      );
    });
  });

  describe('Generate Config Command', () => {
    it('should handle --generate-config with valid agent', () => {
      process.argv = ['node', 'cli.js', '--generate-config', 'amazonq-cli'];

      // Mock the generateConfig function to avoid actual file operations
      vi.doMock('../src/config-generator.js', () => ({
        generateConfig: vi.fn().mockResolvedValue(undefined),
      }));

      runCli();

      // Should not show error or help
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should show error when --generate-config has no agent', () => {
      process.argv = ['node', 'cli.js', '--generate-config'];

      expect(() => runCli()).toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error: --generate-config requires an agent parameter'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Supported agents: amazonq-cli, claude, gemini, opencode'
      );
    });
  });

  describe('System Prompt Command', () => {
    it('should handle --system-prompt flag', () => {
      process.argv = ['node', 'cli.js', '--system-prompt'];

      runCli();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'You are an AI assistant that helps users develop software features'
        )
      );
    });
  });

  describe('Unknown Arguments', () => {
    it('should show error for unknown arguments', () => {
      process.argv = ['node', 'cli.js', '--unknown-flag'];

      runCli();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Unknown arguments:',
        '--unknown-flag'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Responsible Vibe CLI Tools')
      );
    });
  });

  describe('Default Behavior', () => {
    it('should start visualization tool by default', () => {
      process.argv = ['node', 'cli.js'];

      // Mock the visualization launcher to avoid actual tool startup
      vi.doMock('../src/visualization-launcher.js', () => ({
        startVisualizationTool: vi.fn(),
      }));

      runCli();

      // Should not show error
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should start visualization tool with --visualize flag', () => {
      process.argv = ['node', 'cli.js', '--visualize'];

      // Mock the visualization launcher
      vi.doMock('../src/visualization-launcher.js', () => ({
        startVisualizationTool: vi.fn(),
      }));

      runCli();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should start visualization tool with --viz flag', () => {
      process.argv = ['node', 'cli.js', '--viz'];

      // Mock the visualization launcher
      vi.doMock('../src/visualization-launcher.js', () => ({
        startVisualizationTool: vi.fn(),
      }));

      runCli();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
