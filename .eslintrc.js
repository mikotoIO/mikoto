module.exports = {
  ...require('./packages/eslint-config/eslint-preset.js'),
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'max-classes-per-file': 0,
    '@typescript-eslint/lines-between-class-members': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-no-constructed-context-values': 'off',
    'react/no-unstable-nested-components': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'react/destructuring-assignment': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'class-methods-use-this': 'off',
    'import/prefer-default-export': 'off',
    'no-param-reassign': 'off',
    'no-console': 'off',
    'object-curly-spacing': ['error', 'always'],
  },
};