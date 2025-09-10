module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
    'no-console': 'off'
  },
  overrides: [
    {
      files: ['frontend/**/*'],
      env: {
        browser: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier'
      ],
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
};