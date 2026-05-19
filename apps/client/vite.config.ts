/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { type ProxyOptions, defineConfig, loadEnv } from 'vite';

// import { VitePWA } from 'vite-plugin-pwa';

// When running against the production backend (`vite --mode prod-backend`),
// we route /__api and /__media through the dev server so the browser stays
// same-origin and CORS is a non-issue. The target URLs can be overridden
// per-developer via PROXY_API_TARGET / PROXY_MEDIA_TARGET env vars (e.g.
// to point at a staging instance) without editing this file.
const PROD_BACKEND_PROXY: Record<string, ProxyOptions> = {
  '/__api': {
    target: process.env.PROXY_API_TARGET || 'https://server.platform.mikoto.io',
    changeOrigin: true,
    secure: true,
    ws: true,
    rewrite: (p) => p.replace(/^\/__api/, ''),
  },
  '/__media': {
    target: process.env.PROXY_MEDIA_TARGET || 'https://cdn.platform.mikoto.io',
    changeOrigin: true,
    secure: true,
    rewrite: (p) => p.replace(/^\/__media/, ''),
  },
};

export default ({ mode }: { mode: string }) => {
  // Use Vite's loadEnv so .env.[mode] correctly overrides .env. We avoid
  // calling dotenv.config() at module top-level because it pre-populates
  // process.env, and Vite's own env loading then treats those process.env
  // values as authoritative — clobbering the mode-specific overrides
  // (e.g. PUBLIC_MEDIASERVER_URL in .env.prod-backend).
  const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    server: {
      host: env.HOST || undefined,
      port: parseInt(env.PORT || '', 10) || undefined,
      proxy: mode === 'prod-backend' ? PROD_BACKEND_PROXY : undefined,
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
};
