/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
    esbuild: {
      legalComments: 'none',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // '@/*': fileURLToPath(new URL('./src', import.meta.url)),

        '@mikoto-io/permcheck': fileURLToPath(
          new URL('../../packages/permcheck/src/index.ts', import.meta.url),
        ),

        '@hyperschema/client': fileURLToPath(
          new URL(
            '../../hyperschema/typescript-client/src/index.ts',
            import.meta.url,
          ),
        ),

        mikotojs: fileURLToPath(
          new URL('../../packages/mikotojs/src/index.ts', import.meta.url),
        ),
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      // tsconfigPaths(),
      visualizer() as any,
    ],
    define: {
      'process.env.NODE_ENV': `"${mode}"`,
    },
    envPrefix: ['MIKOTO_', 'PUBLIC_'],
  });
