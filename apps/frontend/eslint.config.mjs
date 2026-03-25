import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
      'react/display-name': 'warn',
      'react/no-children-prop': 'warn',
      // React Hooks v7 new rules — downgrade to warn for existing codebase
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    // Ignore E2E test files (Playwright fixtures use non-React patterns)
    ignores: ['.next/**', 'out/**', 'build/**', 'e2e/**'],
  },
]

export default eslintConfig
