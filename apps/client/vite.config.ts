/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
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
          theme_color: '#282A2E',
          background_color: '#282A2E',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
    },
    envPrefix: ['MIKOTO_', 'PUBLIC_'],
  });
