module.exports = {
  ...require("./packages/eslint-config/eslint-preset.js"),
  parserOptions: {
    project: './tsconfig.json'
  }
}