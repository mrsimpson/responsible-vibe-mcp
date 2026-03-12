import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  bundle: true,
  external: ['@modelcontextprotocol/sdk', 'zod'],
  noExternal: ['@codemcp/workflows-core'],
  target: 'node20',
  sourcemap: false,
});
