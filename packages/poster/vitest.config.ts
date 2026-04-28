import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cyberoracle/poster': path.resolve(__dirname, 'src'),
      '@cyberoracle/core': path.resolve(__dirname, '../../core/src'),
      '@cyberoracle/tokens': path.resolve(__dirname, '../../tokens/src'),
    },
  },
});
