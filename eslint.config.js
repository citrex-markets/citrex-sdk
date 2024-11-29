import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jsdoc from 'eslint-plugin-jsdoc'
import unusedImports from 'eslint-plugin-unused-imports'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const config = [
  {
    ignores: ['**/.eslintrc.json', '**/package.json', '**/lib/**'],
  },
  ...fixupConfigRules(
    compat.extends('prettier', 'plugin:import/recommended', 'plugin:import/typescript'),
  ),
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    plugins: {
      'unused-imports': unusedImports,
      '@typescript-eslint': typescriptEslint,
      jsdoc,
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: '**/tsconfig.json',
        },
      },
    },

    rules: {
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'comma-dangle': ['error', 'always-multiline'],

      camelcase: [
        'error',
        {
          properties: 'never',
        },
      ],

      'function-paren-newline': 'off',
      'import/exports-last': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-unused-modules': 'error',
      'import/no-useless-path-segments': 'error',

      'import/order': [
        'error',
        {
          groups: [
            'type',
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
          ],

          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      'jsdoc/no-undefined-types': 'error',
      'jsdoc/tag-lines': [
        'error',
        'never',
        {
          startLines: null,
        },
      ],

      'linebreak-style': 'off',
      'newline-per-chained-call': 'off',
      'no-console': 'off',
      'no-extra-parens': 'off',
      'no-underscore-dangle': 'off',
      'nonblock-statement-body-position': 'error',
      'prefer-named-capture-group': 'off',
      'require-await': 'error',
      'require-unicode-regexp': 'off',
      'no-inline-comments': 'error',
      curly: ['error', 'multi-line', 'consistent'],
      'brace-style': 'error',
      'func-style': ['error', 'expression'],

      'prefer-arrow-callback': [
        'error',
        {
          allowNamedFunctions: true,
        },
      ],

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'error',
    },
  },
]

export default config
