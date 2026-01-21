/**
 * Unit tests for BeadsIntegration epic title formatting with filename
 *
 * Tests that epic titles include plan filenames correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BeadsIntegration } from '@codemcp/workflows-core';

// Mock execSync to avoid actual beads CLI calls
vi.mock('node:child_process', () => ({
  execSync: vi.fn().mockReturnValue('✓ Created issue: test-epic-123'),
}));

describe('BeadsIntegration - Epic Title with Filename', () => {
  let beadsIntegration: BeadsIntegration;

  beforeEach(() => {
    beadsIntegration = new BeadsIntegration('/test/project');
  });

  it('should include filename in epic title when provided', async () => {
    const { execSync } = await import('node:child_process');
    const mockExecSync = vi.mocked(execSync);

    await beadsIntegration.createProjectEpic(
      'my-project',
      'epcc',
      'Build an awesome feature',
      'development-plan-feature-auth.md'
    );

    // Verify that execSync was called with the expected title format
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'bd create "my-project: epcc (development-plan-feature-auth.md)"'
      ),
      expect.any(Object)
    );
  });

  it('should use original title format when filename not provided', async () => {
    const { execSync } = await import('node:child_process');
    const mockExecSync = vi.mocked(execSync);

    await beadsIntegration.createProjectEpic(
      'my-project',
      'epcc',
      'Build an awesome feature'
    );

    // Verify that execSync was called with the original title format
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('bd create "my-project: epcc"'),
      expect.any(Object)
    );

    // Ensure it doesn't contain parentheses when no filename
    const call = mockExecSync.mock.calls[0][0] as string;
    expect(call).not.toContain('(');
    expect(call).not.toContain(')');
  });

  it('should handle various filename formats', async () => {
    const { execSync } = await import('node:child_process');
    const mockExecSync = vi.mocked(execSync);

    const testCases = [
      'development-plan-main.md',
      'development-plan-feature-dashboard.md',
      'development-plan-bugfix-123.md',
      'plan.md',
    ];

    for (const filename of testCases) {
      mockExecSync.mockClear();

      await beadsIntegration.createProjectEpic(
        'test-project',
        'waterfall',
        undefined,
        filename
      );

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(
          `bd create "test-project: waterfall (${filename})"`
        ),
        expect.any(Object)
      );
    }
  });
});
