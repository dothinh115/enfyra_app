import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/helpers/setup.ts']
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '../app'),
      '@': resolve(__dirname, '../app'),
      '#app': resolve(__dirname, '../.nuxt'),
      '#ui': resolve(__dirname, '../node_modules/@nuxt/ui'),
      '#imports': resolve(__dirname, '../.nuxt/imports.d.ts')
    }
  }
})