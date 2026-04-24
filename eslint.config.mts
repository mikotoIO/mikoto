import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';

export default defineConfig({
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    'build/**',
    '**/*.min.js',
    '**/metro.config.js',
    '**/*.gen.ts',
    '.claude/**',
    'target/**',

    // todo: revisit projects
    'apps/desktop/**',
  ],

  // files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  files: ['**/*.{ts,tsx}'],

  // Base JS/TS configuration
  extends: [
    js.configs.recommended,
    ts.configs.recommended,
    eslintReact.configs['recommended-typescript'],
  ],

  languageOptions: {
    parser: ts.parser,
    parserOptions: {
      // Enable project service for better TypeScript integration
      projectService: true,
      // tsconfigRootDir: import.meta.dirname,
      tsconfigRootDir: '/apps/client',
    },

    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
});
