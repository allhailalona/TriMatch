/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution') // eslint-disable-line

module.exports = {
  root: true,
  env: {
    node: true, // Enable Node.js global variables
    es6: true // Enable ES6 features
  },
  extends: [
    'plugin:vue/vue3-essential', // Essential rules for Vue 3
    '@vue/eslint-config-typescript', // TypeScript support for typesript Vue
    'plugin:node/recommended', // Recommended rules for Node.js
    'plugin:@typescript-eslint/recommended' // Recommended rules for TypeScript node.js
  ],
  parserOptions: {
    ecmaVersion: 'latest', // Use the latest ECMAScript features
    sourceType: 'module' // Allows the use of imports
  },
  parser: '@typescript-eslint/parser', // Specify the TypeScript parser
  rules: {
    // No additional rules defined; this keeps the configuration clean and minimal.
  }
}
