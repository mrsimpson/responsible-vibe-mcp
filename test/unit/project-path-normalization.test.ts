/**
 * Unit tests for project path normalization logic
 *
 * Tests the stripVibePathSuffix utility function that strips /.vibe suffix
 * to get the correct project root.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { stripVibePathSuffix } from '../../packages/mcp-server/src/server-helpers.js';

describe('Project Path Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('stripVibePathSuffix function', () => {
    it('should strip /.vibe suffix from provided path', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom/project/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom/project');
    });

    it('should return provided path unchanged when no /.vibe suffix', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom/project';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom/project');
    });

    it('should return default path when no provided path', () => {
      const defaultPath = '/default/project';
      const providedPath = undefined;

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/default/project');
    });

    it('should handle empty string provided path', () => {
      const defaultPath = '/default/project';
      const providedPath = '';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/default/project');
    });

    it('should handle path that ends with .vibe but not /.vibe', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom/project.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom/project.vibe');
    });

    it('should handle nested .vibe directories correctly', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom/project/.vibe/nested/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom/project/.vibe/nested');
    });

    it('should handle root-level .vibe directory', () => {
      const defaultPath = '/default/project';
      const providedPath = '/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('');
    });

    it('should handle Windows-style paths with .vibe suffix', () => {
      const defaultPath = 'C:\\default\\project';
      const providedPath = 'C:\\custom\\project\\.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      // Should not strip Windows-style path since we only look for /.vibe
      expect(result).toBe('C:\\custom\\project\\.vibe');
    });

    it('should handle relative paths with .vibe suffix', () => {
      const defaultPath = './default/project';
      const providedPath = './custom/project/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('./custom/project');
    });

    it('should handle paths with multiple consecutive slashes', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom//project//.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom//project/');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null provided path', () => {
      const defaultPath = '/default/project';
      const providedPath = null;

      const result = stripVibePathSuffix(
        providedPath as unknown as string,
        defaultPath
      );

      expect(result).toBe('/default/project');
    });

    it('should handle very long paths with .vibe suffix', () => {
      const defaultPath = '/default/project';
      const longPath =
        '/very/long/path/with/many/nested/directories/that/goes/on/and/on/.vibe';

      const result = stripVibePathSuffix(longPath, defaultPath);

      expect(result).toBe(
        '/very/long/path/with/many/nested/directories/that/goes/on/and/on'
      );
    });

    it('should handle path that is exactly "/.vibe"', () => {
      const defaultPath = '/default/project';
      const providedPath = '/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('');
    });

    it('should handle path with special characters and .vibe suffix', () => {
      const defaultPath = '/default/project';
      const providedPath = '/custom/project-with-special_chars@123/.vibe';

      const result = stripVibePathSuffix(providedPath, defaultPath);

      expect(result).toBe('/custom/project-with-special_chars@123');
    });
  });
});
