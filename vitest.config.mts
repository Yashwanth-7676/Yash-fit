import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/security/**/*.test.ts',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
