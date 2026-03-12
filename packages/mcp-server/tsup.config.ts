import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  bundle: true,
  // Keep core as external - it has resources that can't be bundled
  external: ['@modelcontextprotocol/sdk', 'zod', '@codemcp/workflows-core'],
  target: 'node20',
  sourcemap: false,
});
