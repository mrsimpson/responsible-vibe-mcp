/**
 * Unit tests for BeadsPlugin Goal extraction functionality
 *
 * Tests the extractGoalFromPlan method that extracts meaningful goal content
 * from development plan files for use in beads integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestAccess } from '../utils/test-access.js';
import { BeadsPlugin } from '../../src/plugin-system/beads-plugin.js';

describe('BeadsPlugin - Goal Extraction', () => {
  let plugin: BeadsPlugin;

  beforeEach(() => {
    // Mock environment variable for plugin enablement
    vi.stubEnv('TASK_BACKEND', 'beads');
    plugin = new BeadsPlugin({ projectPath: '/test/project' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('extractGoalFromPlan', () => {
    it('should extract meaningful goal content', () => {
      const planContent = `# Development Plan: Test Project

## Goal
Build a user authentication system with JWT tokens and password reset functionality.

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBe(
        'Build a user authentication system with JWT tokens and password reset functionality.'
      );
    });

    it('should return undefined for placeholder goal content', () => {
      const planContent = `# Development Plan: Test Project

## Goal
*Define what you're building or fixing - this will be updated as requirements are gathered*

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for "To be defined" content', () => {
      const planContent = `# Development Plan: Test Project

## Goal
To be defined during exploration

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for very short content', () => {
      const planContent = `# Development Plan: Test Project

## Goal
Fix bug

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBeUndefined();
    });

    it('should handle multiline goal content correctly', () => {
      const planContent = `# Development Plan: Test Project

## Goal
Implement a comprehensive logging system that captures:
- User actions and authentication events  
- API request/response cycles
- System errors with stack traces
- Performance metrics

The system should support different log levels and output formats.

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result)
        .toBe(`Implement a comprehensive logging system that captures:
- User actions and authentication events  
- API request/response cycles
- System errors with stack traces
- Performance metrics

The system should support different log levels and output formats.`);
    });

    it('should return undefined when no Goal section exists', () => {
      const planContent = `# Development Plan: Test Project

## Explore
### Tasks
- [ ] Analyze requirements
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty or null input', () => {
      expect(
        TestAccess.callMethod(plugin, 'extractGoalFromPlan', '')
      ).toBeUndefined();

      expect(
        TestAccess.callMethod(plugin, 'extractGoalFromPlan', null)
      ).toBeUndefined();

      expect(
        TestAccess.callMethod(plugin, 'extractGoalFromPlan', undefined)
      ).toBeUndefined();
    });

    it('should stop at the next section boundary', () => {
      const planContent = `# Development Plan: Test Project

## Goal
Build a user authentication system with secure login and registration.

## Key Decisions
- Using JWT for token-based authentication
- Password hashing with bcrypt
`;

      const result = TestAccess.callMethod(
        plugin,
        'extractGoalFromPlan',
        planContent
      );

      expect(result).toBe(
        'Build a user authentication system with secure login and registration.'
      );
    });
  });

  describe('plan filename extraction', () => {
    it('should extract filename from plan file path correctly', () => {
      // Test the logic used in setupBeadsIntegration
      const planFilePath = '/project/.vibe/development-plan-feature-auth.md';
      const planFilename = planFilePath.split('/').pop();

      expect(planFilename).toBe('development-plan-feature-auth.md');
    });

    it('should handle various plan file path formats', () => {
      const testCases = [
        {
          path: '/Users/dev/my-project/.vibe/development-plan-main.md',
          expected: 'development-plan-main.md',
        },
        {
          path: 'development-plan-bugfix.md',
          expected: 'development-plan-bugfix.md',
        },
        {
          path: '/deep/nested/path/to/.vibe/development-plan-feature-dashboard.md',
          expected: 'development-plan-feature-dashboard.md',
        },
      ];

      for (const { path, expected } of testCases) {
        const filename = path.split('/').pop();
        expect(filename).toBe(expected);
      }
    });
  });
});
