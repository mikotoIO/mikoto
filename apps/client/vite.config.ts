/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// import { VitePWA } from 'vite-plugin-pwa';

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
      },
      dedupe: ['valtio', 'react', 'react-dom'],
    },
    plugins: [
      react({
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      // tsconfigPaths(),
      visualizer() as any,
      // PWA disabled due to caching issues
      // VitePWA({ ... }),
    ],
    define: {
      'process.env.NODE_ENV': `"${mode}"`,
      __COMMIT_HASH__: JSON.stringify(
        (() => {
          try {
            return execSync('git rev-parse --short HEAD').toString().trim();
          } catch {
            return process.env.COMMIT_HASH || 'unknown';
          }
        })(),
      ),
    },
    envPrefix: ['MIKOTO_', 'PUBLIC_'],
  });
