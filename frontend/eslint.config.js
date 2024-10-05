import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactRefresh from 'eslint-plugin-react-refresh'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import { fixupPluginRules } from '@eslint/compat'
import stylistic from '@stylistic/eslint-plugin'

// /** @type {import("eslint").Linter.Config[]} */
const output = [
  { files: ['**/*.{ts,tsx}'] },
  { ignores: ['**/dist', 'node_modules'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-refresh': reactRefresh,
      // @ts-expect-error - `fixupPluginRules` is not typed
      'react-hooks': fixupPluginRules(pluginReactHooks),
    },
  },
  {
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],
      'react/prop-types': 'off',
    },
  }, {
    settings: {
      react: {
        version: 'detect',
      },
    },
  }, stylistic.configs['recommended-flat'],
  {
    plugins: {
      '@stylistic': stylistic,
    },
  },
]

export default output
