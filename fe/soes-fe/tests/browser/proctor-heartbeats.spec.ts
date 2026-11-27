import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('500 live rows batch heartbeats and reject stale messages within the same frame', async ({ page }) => {
  const socket = await readFile(new URL('./fixtures/proctor-socket.mjs', import.meta.url), 'utf8')
  await page.route('**/src/api/socket.ts*', route => route.fulfill({ contentType: 'application/javascript', body: socket }))
  await page.goto('/tests/browser/fixtures/proctor-heartbeats.html')
  await expect(page.locator('tbody tr')).toHaveCount(500)
  const before = await page.evaluate(() => ({ ...window.proctorProfile }))
  await page.getByRole('button', { name: 'Flood 500' }).click()
  await expect(page.getByLabel('online')).toHaveText('500')
  const after = await page.evaluate(() => ({ ...window.proctorProfile }))
  expect(after.commits - before.commits).toBeLessThanOrEqual(2)
  console.log(JSON.stringify({ workload: '500 rows, 1000 heartbeat messages', commits: after.commits - before.commits,
    renderDurationMs: after.durationMs - before.durationMs, transport: 'fixture socket, actual hook and table' }))
})
