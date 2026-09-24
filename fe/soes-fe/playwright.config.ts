import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  workers: 1,
  use: { baseURL: process.env.VISION_TEST_URL ?? 'http://127.0.0.1:5174', headless: true },
})
