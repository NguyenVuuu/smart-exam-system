import { expect, test } from '@playwright/test'

test('score page requests bounded pages and keeps server summaries across navigation', async ({ page }) => {
  const requests: string[] = []
  await page.route('**/api/student/subjects**', route => route.fulfill({ json: { success: true, data: {
    items: [], currentSemesterId: 'term', semesterOptions: [{ id: 'term', name: 'Term', isCurrent: true }],
  } } }))
  await page.route('**/api/student/scores**', async route => {
    const url = new URL(route.request().url())
    requests.push(url.search)
    expect(url.searchParams.get('pageSize')).toBe('10')
    const number = Number(url.searchParams.get('page'))
    const keyword = url.searchParams.get('keyword')
    await route.fulfill({ json: { success: true, data: {
      items: Array.from({ length: 10 }, (_, index) => ({ title: `${keyword || 'Score'}-${(number - 1) * 10 + index + 1}` })),
      pagination: { page: number, pageSize: 10, totalItems: 50, totalPages: 5 }, averageScore: 7.5, highestScore: 10,
    } } })
  })
  await page.goto('/tests/browser/fixtures/score-page.html')
  await expect(page.getByLabel('status')).toHaveText('ready')
  await expect(page.getByLabel('rows')).toContainText('Score-1,Score-2')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByLabel('rows')).toContainText('Score-11,Score-12')
  await expect(page.getByLabel('summary')).toHaveText(JSON.stringify({ page: 2, total: 50, average: 7.5 }))
  await page.getByLabel('search').fill('Java')
  await expect(page.getByLabel('rows')).toContainText('Java-1,Java-2')
  await expect(page.getByLabel('summary')).toHaveText(JSON.stringify({ page: 1, total: 50, average: 7.5 }))
  expect(requests).toHaveLength(3)
})
