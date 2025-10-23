import { describe, it, expect, beforeEach, vi } from 'vitest';
import { spawn } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process');

describe('Visualization Launcher', () => {
  let startVisualizationTool: () => void;
  let mockSpawn: ReturnType<typeof vi.mocked>;

  beforeEach(async () => {
    // Setup mock
    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockReturnValue({
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          callback(0); // Simulate successful completion
        }
      }),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    } as unknown);

    // Import from source
    const module = await import('../src/visualization-launcher.js');
    startVisualizationTool = module.startVisualizationTool;
  });

  it('should start visualization tool with npm install in dev mode', () => {
    process.env['NODE_ENV'] = 'development';

    startVisualizationTool();

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        stdio: 'inherit',
        shell: true,
      })
    );
  });

  it('should handle errors gracefully', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock spawn to throw an error
    mockSpawn.mockImplementation(() => {
      throw new Error('spawn failed');
    });

    expect(() => startVisualizationTool()).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Error starting workflow visualizer:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
