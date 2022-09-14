/// <reference types="vitest" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
  resolve: {
    alias: [
      {
        find: /^@pinia\/(.*?)$/,
        replacement: fileURLToPath(
          new URL('./packages/packages/$1/src', import.meta.url)
        ),
      },
      {
        find: /^pinia$/,
        replacement: fileURLToPath(
          new URL('./packages/pinia/src', import.meta.url)
        ),
      },
    ],
  },
  test: {
    coverage: {
      reporter: ['html', 'lcov', 'text'],
      include: ['packages/pinia/src/**/*.ts', 'packages/testing/src/**/*.ts'],
      exclude: [
        '**/src/index.ts',
        '**/*.d.ts',
        '**/src/devtools',
        '**/src/hmr.ts',
        '**/src/deprecated.ts',
        '**/src/vue2-plugin.ts',
      ],
    },
    environment: 'happy-dom',
    globals: true, // Specifically to make createTestingPinia happy
  },
})
