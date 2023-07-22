import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default () =>
  defineConfig({
    build: {
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: '@mikoto-io/lucid',
        formats: ['umd'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        output: { interop: 'auto' },
        external: ['react', 'react-dom', 'styled-components'],
      },
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
    ],
  });
