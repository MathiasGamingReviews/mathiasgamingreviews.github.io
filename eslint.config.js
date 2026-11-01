// @ts-check
/**
 * @file ESLint configuration (npm run lint).
 * TypeScript and templates: angular-eslint recommended rules plus the project rules below.
 * Node scripts (scripts/**\/*.mjs): ESLint recommended rules.
 */

const eslint = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** Numbers allowed inline; everything else must be a named constant. */
const ALLOWED_NUMBERS = [-1, 0, 1, 2];

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      // Routed pages end in "Page", reusable components in "Component".
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component', 'Page'] }],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        { ignore: ALLOWED_NUMBERS, ignoreEnums: true, ignoreReadonlyClassProperties: true, ignoreTypeIndexes: true },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    extends: [eslint.configs.recommended],
    languageOptions: { globals: globals.node, sourceType: 'module', ecmaVersion: 'latest' },
    rules: {
      'no-magic-numbers': ['error', { ignore: ALLOWED_NUMBERS, ignoreDefaultValues: true }],
    },
  },
  {
    // Tests use literal values; config files are where the named constants are defined.
    files: ['scripts/test/**/*.mjs', 'scripts/lib/config.mjs'],
    rules: { 'no-magic-numbers': 'off' },
  },
  {
    files: ['src/app/core/site.config.ts'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },
);
