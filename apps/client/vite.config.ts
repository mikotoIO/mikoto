/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

dotenv.config();

export default ({ mode }: { mode: string }) =>
  defineConfig({
    server: {
      host: process.env.HOST || undefined,
      port: parseInt(process.env.PORT || '', 10) || undefined,
    },
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
