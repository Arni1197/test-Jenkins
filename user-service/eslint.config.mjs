// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ✅ Ограничим type-aware пресеты только src
const typeCheckedForSrc = tseslint.configs.recommendedTypeChecked.map((cfg) => ({
  ...cfg,
  files: ['src/**/*.ts'],
}));

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
  },

  eslint.configs.recommended,

  // Базовые TS-правила (без type-aware) — можно оставить глобально
  ...tseslint.configs.recommended,

  // ✅ Type-aware строгость — только для src
  ...typeCheckedForSrc,

  eslintPluginPrettierRecommended,

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

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // ✅ Ослабление ТОЛЬКО для тестов
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

      // по желанию — чтобы не шумело на моках
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);