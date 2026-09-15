import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const gameOnlyImportMessage =
  'Play/arena code belongs in the game bundle (game/src) or app/play/PlayPage.dev.tsx — not in marketing web routes.'

export default defineConfig([
  globalIgnores(['.next', '.cache', 'dist', 'node_modules', 'public/play', 'game']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/screens/**',
      'src/components/Game/**',
      'src/components/CardPlaceholder/**',
      'src/gameplay/**',
      'src/app/play/**',
      'src/config/game/**',
      'game/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'gsap',
              message: gameOnlyImportMessage,
            },
          ],
          patterns: [
            {
              group: ['@/screens/PlayPage/*', '@/screens/PlayPage/**'],
              message: gameOnlyImportMessage,
            },
            {
              group: ['@/components/Game/*', '@/components/Game/**', '@/gameplay/*', '@/gameplay/**'],
              message: gameOnlyImportMessage,
            },
          ],
        },
      ],
    },
  },
])
