import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Demo branch — client-only build deployed at jleape.github.io/apps/rowboat/.
// Setting `base` makes Vite emit asset URLs prefixed with /apps/rowboat/ so
// the bundle works under a subdirectory. For local `vite dev`, base is set
// to '/' since we serve at the root locally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/apps/rowboat/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5273,
    strictPort: true,
  },
  worker: {
    format: 'es',
  },
}));
