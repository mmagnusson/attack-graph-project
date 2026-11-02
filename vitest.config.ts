import { defineConfig } from 'vitest/config'

// Engine tests run in Node; the Cloudflare plugin from vite.config.ts is not needed here.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
