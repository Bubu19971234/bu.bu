// Root flat config shared by every workspace package.
import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const scoped = (configs, files) => configs.map((c) => ({ ...c, files }));

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/.expo/**', '**/next-env.d.ts', '**/expo-env.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              importNames: ['createClient'],
              message: 'Use the factories in @ftn/supabase (public) or @ftn/supabase/server (privileged).',
            },
          ],
        },
      ],
    },
  },
  // Mobile must never import server-only code.
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@ftn/supabase/server', '**/server/**'], message: 'Server-only module in client code.' }] },
      ],
    },
  },
  ...scoped(nextVitals, ['apps/web/**/*.{ts,tsx}']),
  {
    files: ['packages/supabase/src/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
