// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ✅ Ограничим type-aware пресеты только папкой src
const typeCheckedForSrc = tseslint.configs.recommendedTypeChecked.map((cfg) => ({
  ...cfg,
  files: ['src/**/*.ts'],
}));

export default tseslint.config(
  // 1) Игноры
  {
    ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
  },

  // 2) Базовые правила JS
  eslint.configs.recommended,

  // 3) Базовые TS-правила (без type-awareness) — можно и глобально
  ...tseslint.configs.recommended,

  // 4) Type-aware правила — только src/**
  ...typeCheckedForSrc,

  // 5) Prettier
  eslintPluginPrettierRecommended,

  // 6) Общие languageOptions
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // sourceType можно убрать, если не уверен.
      // Если у тебя NestJS на commonjs — оставляй.
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 7) Твои общие правила
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',

      // Пускай будет warn — полезно видеть долг
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // 8) ✅ Ослабление ТОЛЬКО для тестов
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.integration.spec.ts',
      '**/__tests__/**/*.ts',
    ],
    rules: {
      // В тестах это обычно шум
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Часто мешает мокам
      '@typescript-eslint/no-explicit-any': 'off',

      // По желанию:
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);