import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['../../test/setup.ts'],
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.build.json',
    },
    env: {
      LOG_LEVEL: 'ERROR', // Suppress all logs for mcp-server tests
      NODE_ENV: 'test',
      VITEST: 'true',
    },
  },
});
