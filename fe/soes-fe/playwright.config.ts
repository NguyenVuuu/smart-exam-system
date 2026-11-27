import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  workers: 1,
  webServer: process.env.CI ? {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    timeout: 60_000,
    reuseExistingServer: false,
  } : undefined,
  use: { baseURL: process.env.VISION_TEST_URL ?? 'http://127.0.0.1:5174', headless: true },
})
