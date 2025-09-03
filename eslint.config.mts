import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sharedRules = {
  '@typescript-eslint/no-explicit-any': 'off',
};

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'apps/docs/.next/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      '.claude/**',
      'target/**',
    ],
  },

  // Base JS/TS configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...sharedRules,
    },
  },

  // React configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      ...sharedRules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
