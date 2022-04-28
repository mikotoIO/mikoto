module.exports = {
  ...require("./packages/eslint-config/eslint-preset.js"),
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "no-param-reassign": "off",
    "no-console": "off",
    "object-curly-spacing": ["error", "always"]
  }
}