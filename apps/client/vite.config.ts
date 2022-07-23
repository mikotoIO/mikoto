/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default ({ mode }: { mode: string }) => defineConfig({
    plugins: [react(), visualizer() as any],
    define: {
      'process.env.NODE_ENV': `"${mode}"`,
    },
    test: {
      globals: true,
    },
  });
