import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@cyberoracle/core': path.resolve(__dirname, 'src'),
      '@cyberoracle/tokens': path.resolve(__dirname, '../../tokens/src'),
    },
  },
});
