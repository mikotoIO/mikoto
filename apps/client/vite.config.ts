/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo/mikoto.svg'],
        manifest: {
          name: 'Mikoto',
          short_name: 'Mikoto',
          description: 'Turbocharge Your Community',
          theme_color: '#0a0a0c',
          background_color: '#0a0a0c',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'logo/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'logo/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'logo/mikoto.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          screenshots: [
            {
              src: 'logo/screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Mikoto Desktop',
            },
            {
              src: 'logo/screenshot-mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mikoto Mobile',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2,ttf}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
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
