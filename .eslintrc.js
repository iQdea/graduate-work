const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
    'node',
    'import',
    'jest',
    'promise',
    'unicorn',
    '@typescript-eslint/eslint-plugin',
  ],
  extends: [
    'plugin:prettier/recommended',
    'eslint:recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js'
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'node/no-process-env': 'error',
    'no-console': 'error',
    'max-len': ['error', 120, 4],
    'semi': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'quotes': ['error', 'single', {
      'avoidEscape': true,
      'allowTemplateLiterals': true,
    }],
    'curly': 'error',
    'consistent-return': 'error',
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    'promise/catch-or-return': ['error', {allowFinally: true}],
    'promise/no-new-statics': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/empty-brace-spaces': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-array-method-this-argument': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/no-useless-undefined': 'off',
    'jest/no-identical-title': 'error'
  },
  overrides: [
    {
      files: ['src/**/*.seeder.ts'],
      rules: {
        'prettier/prettier': 'off'
      }
    }
  ]
};
