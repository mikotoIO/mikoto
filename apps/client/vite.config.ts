/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default ({ mode }: { mode: string }) =>
  defineConfig({
    build: {
      target: 'es2020',
    },
    plugins: [
      react({
        babel: {
          plugins: [
            [
              'babel-plugin-styled-components',
              {
                displayName: true,
                fileName: false,
              },
            ],
          ],
        },
      }),
      visualizer() as any,
    ],
    define: {
      'process.env.NODE_ENV': `"${mode}"`,
    },
    envPrefix: 'MIKOTO_',
  });
