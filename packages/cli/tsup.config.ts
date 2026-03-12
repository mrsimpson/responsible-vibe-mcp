import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  bundle: true,
  external: ['@modelcontextprotocol/sdk'],
  noExternal: ['@codemcp/workflows-core', '@codemcp/workflows-server'],
  target: 'node20',
  sourcemap: false,
});
