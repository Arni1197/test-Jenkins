// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ✅ Type-aware правила только для src
const typeCheckedForSrc = tseslint.configs.recommendedTypeChecked.map((cfg) => ({
  ...cfg,
  files: ['src/**/*.ts'],
}));

export default tseslint.config(
  // 1) Игноры
  {
    ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
  },

  // 2) JS база
  eslint.configs.recommended,

  // 3) TS база без type-aware
  ...tseslint.configs.recommended,

  // 4) Type-aware строгость только для src
  ...typeCheckedForSrc,

  // 5) Prettier
  eslintPluginPrettierRecommended,

  // 6) Общие language options
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 7) Базовые правила проекта
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // 8) ✅ Ослабление только для тестов
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.integration.spec.ts',
      '**/__tests__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // 9) ✅ Если хочешь НЕ блокировать развитие на старте:
  // отключаем шумные unsafe именно в src
  // (этот блок должен быть последним)
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
);