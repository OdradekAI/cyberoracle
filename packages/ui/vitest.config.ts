import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@cyberoracle/ui': resolve(__dirname, './src/index.ts'),
      '@cyberoracle/tokens': resolve(__dirname, '../tokens/src/index.ts'),
    },
  },
});
