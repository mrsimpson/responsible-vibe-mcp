import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 *
 * This workspace configuration allows running tests across all packages
 * in the monorepo with a single command while maintaining package-specific
 * configurations.
 *
 * Usage:
 *   - Run all tests: pnpm test
 *   - Run specific project: vitest --project=core
 *   - Watch mode: vitest --watch
 *   - UI mode: vitest --ui
 */
export default defineWorkspace([
  // Root-level integration tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'root',
      include: ['test/**/*.test.ts'],
    },
  },
  // All workspace packages with their own configs
  'packages/cli',
  'packages/core',
  'packages/mcp-server',
]);
