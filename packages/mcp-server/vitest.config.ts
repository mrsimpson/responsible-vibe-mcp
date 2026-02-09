import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['../../test/setup.ts'],
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
    testTimeout: 30000, // Increased to accommodate beads auto-detection overhead
    typecheck: {
      tsconfig: './tsconfig.build.json',
    },
    env: {
      LOG_LEVEL: 'ERROR', // Keep ERROR level to catch real issues
      NODE_ENV: 'test',
      VITEST: 'true',
    },
  },
});
