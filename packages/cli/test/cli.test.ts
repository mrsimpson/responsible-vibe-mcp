import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted for proper test isolation
const mocks = vi.hoisted(() => ({
  WorkflowManager: vi.fn(),
  generateSystemPrompt: vi.fn(),
  StateMachineLoader: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  join: vi.fn(),
  dirname: vi.fn(),
  fileURLToPath: vi.fn(),
  spawn: vi.fn(),
  generateConfig: vi.fn(),
}));

vi.mock('@codemcp/workflows-core', () => ({
  WorkflowManager: mocks.WorkflowManager,
  generateSystemPrompt: mocks.generateSystemPrompt,
  StateMachineLoader: mocks.StateMachineLoader,
}));

vi.mock('node:fs', () => ({
  existsSync: mocks.existsSync,
  mkdirSync: mocks.mkdirSync,
  writeFileSync: mocks.writeFileSync,
  readFileSync: mocks.readFileSync,
}));

vi.mock('node:path', () => ({
  join: mocks.join,
  dirname: mocks.dirname,
}));

vi.mock('node:url', () => ({
  fileURLToPath: mocks.fileURLToPath,
}));

vi.mock('node:child_process', () => ({
  spawn: mocks.spawn,
}));

vi.mock('../src/config-generator.js', () => ({
  generateConfig: mocks.generateConfig,
}));

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

    // Mock process.cwd
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');

    // Configure mocks
    mocks.WorkflowManager.mockImplementation(() => ({
      getAvailableWorkflowsForProject: vi.fn().mockReturnValue([
        { name: 'waterfall', description: 'V-Model development workflow' },
        { name: 'epcc', description: 'EPCC workflow' },
      ]),
      getAllAvailableWorkflows: vi.fn().mockReturnValue([
        { name: 'waterfall', description: 'V-Model development workflow' },
        { name: 'epcc', description: 'EPCC workflow' },
      ]),
    }));
    mocks.generateSystemPrompt.mockReturnValue('Mock system prompt');
    mocks.StateMachineLoader.mockImplementation(() => ({
      loadStateMachine: vi.fn().mockReturnValue({}),
    }));

    mocks.existsSync.mockImplementation(path => {
      const pathStr = String(path);
      if (
        pathStr.includes('resources/workflows/') &&
        pathStr.includes('waterfall.yaml')
      )
        return true;
      if (pathStr.includes('my-custom.yaml')) return false;
      if (pathStr.includes('.vibe')) return false;
      return false;
    });
    mocks.mkdirSync.mockImplementation(() => undefined);
    mocks.writeFileSync.mockImplementation(() => {});
    mocks.readFileSync.mockReturnValue(
      "name: 'waterfall'\ndescription: 'test'"
    );

    mocks.join.mockImplementation((...args) => args.join('/'));
    mocks.dirname.mockReturnValue('/mock/dirname');
    mocks.fileURLToPath.mockReturnValue('/mock/filename.js');

    // Mock spawn to prevent actual process spawning in tests
    mocks.spawn.mockReturnValue({
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          // Simulate successful process completion
          setTimeout(() => callback(0), 0);
        }
        return this;
      }),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      kill: vi.fn(),
    } as unknown);

    // Mock generateConfig to prevent actual file generation
    mocks.generateConfig.mockResolvedValue(undefined);

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

    // Clear all mocks
    vi.clearAllMocks();
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

      // generateConfig is already mocked in beforeEach
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
      // Don't throw on process.exit for this test
      processExitSpy.mockImplementation(() => undefined as never);

      process.argv = ['node', 'cli.js', '--system-prompt'];

      runCli();

      expect(consoleLogSpy).toHaveBeenCalledWith('Mock system prompt');
    });
  });

  describe('Workflow Commands', () => {
    it('should handle workflow list command', () => {
      process.argv = ['node', 'cli.js', 'workflow', 'list'];

      runCli();

      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Available workflows:');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('waterfall')
      );
    });

    it('should handle workflow copy command', async () => {
      // Don't throw on process.exit for this test
      processExitSpy.mockImplementation(() => undefined as never);

      process.argv = [
        'node',
        'cli.js',
        'workflow',
        'copy',
        'waterfall',
        'my-custom',
      ];

      runCli();

      // Verify source workflow validation was called
      const { WorkflowManager } = await import('@codemcp/workflows-core');
      const mockInstance = vi.mocked(WorkflowManager).mock.results[0].value;
      expect(mockInstance.getAllAvailableWorkflows).toHaveBeenCalled();

      // Verify file operations
      const fs = await import('node:fs');
      expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledWith(
        expect.stringContaining('waterfall.yaml'),
        'utf8'
      );
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledWith(
        expect.stringContaining('my-custom.yaml'),
        expect.stringContaining("name: 'my-custom'")
      );

      // Verify success message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Copied 'waterfall' workflow to 'my-custom'")
      );
    });

    it('should show error for invalid source workflow', async () => {
      // Reset the mock to return workflows without 'invalid-workflow'
      const { WorkflowManager } = await import('@codemcp/workflows-core');
      vi.mocked(WorkflowManager).mockImplementation(
        () =>
          ({
            getAvailableWorkflowsForProject: vi.fn().mockReturnValue([
              {
                name: 'waterfall',
                description: 'V-Model development workflow',
              },
              { name: 'epcc', description: 'EPCC workflow' },
            ]),
            getAllAvailableWorkflows: vi.fn().mockReturnValue([
              {
                name: 'waterfall',
                description: 'V-Model development workflow',
              },
              { name: 'epcc', description: 'EPCC workflow' },
            ]),
          }) as unknown
      );

      process.argv = [
        'node',
        'cli.js',
        'workflow',
        'copy',
        'invalid-workflow',
        'my-custom',
      ];

      processExitSpy.mockImplementation(() => undefined as never);

      runCli();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Invalid source workflow: invalid-workflow')
      );
    });

    it('should show error when workflow copy has missing parameters', () => {
      process.argv = ['node', 'cli.js', 'workflow', 'copy'];

      // Mock process.exit to not throw for this test
      processExitSpy.mockImplementation(() => undefined as never);

      runCli();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'workflow copy requires source workflow and custom name'
        )
      );
    });

    it('should show error for unknown workflow subcommand', () => {
      process.argv = ['node', 'cli.js', 'workflow', 'unknown'];

      // Mock process.exit to not throw for this test
      processExitSpy.mockImplementation(() => undefined as never);

      runCli();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Unknown workflow subcommand:',
        'unknown'
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

      // spawn is already mocked in beforeEach, so no actual processes will be spawned
      runCli();

      // Should not show error
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should start visualization tool with --visualize flag', () => {
      process.argv = ['node', 'cli.js', '--visualize'];

      // spawn is already mocked in beforeEach, so no actual processes will be spawned
      runCli();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should start visualization tool with --viz flag', () => {
      process.argv = ['node', 'cli.js', '--viz'];

      // spawn is already mocked in beforeEach, so no actual processes will be spawned
      runCli();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
