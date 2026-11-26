import { expect, test } from '@playwright/test'

test('single-score adjustment preserves reason validation and payload', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/submission-modals.html')
  const confirm = page.getByRole('button', { name: 'Xác nhận chốt điểm' })
  await expect(confirm).toBeDisabled()
  await page.getByRole('textbox').fill('Valid reason')
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page.getByLabel('result')).toHaveText(JSON.stringify({
    reason: 'Valid reason', type: 'OTHER', evidenceUrls: [], violationIds: [],
  }))
})

test('bulk-score adjustment keeps the edited reason and score', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/submission-modals.html?bulk=1')
  const confirm = page.getByRole('button', { name: 'Chốt cả ca (1 bài)' })
  await expect(confirm).toBeDisabled()
  await page.getByRole('textbox').fill('Bulk reason')
  await confirm.click()
  await expect(page.getByLabel('result')).toContainText('Bulk reason')
  const result = JSON.parse(await page.getByLabel('result').textContent() ?? 'null')
  expect(result).toMatchObject([{ reason: 'Bulk reason', score: 6, adjustmentType: 'OTHER' }])
})
