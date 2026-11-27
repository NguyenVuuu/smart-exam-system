import { expect, test } from '@playwright/test'

test('programming examples preserve exact stdin/stdout line breaks without changing test data', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/practice-example.html')
  const input = page.getByLabel('Ví dụ đầu vào', { exact: true })
  const output = page.getByLabel('Ví dụ đầu ra', { exact: true })
  await expect(input).toHaveText('5\n1 2 3 4 5', { useInnerText: true })
  await expect(output).toHaveText('15\n5', { useInnerText: true })
  expect(await input.evaluate(element => element.textContent)).toBe('5\n1 2 3 4 5')
  expect(await output.evaluate(element => element.textContent)).toBe('15\n5')
  expect(await input.evaluate(element => getComputedStyle(element).whiteSpace)).toBe('pre-wrap')
  const lineHeight = await input.evaluate(element => Number.parseFloat(getComputedStyle(element).lineHeight))
  const box = await input.boundingBox()
  if (Number.isFinite(lineHeight)) expect(box!.height).toBeGreaterThanOrEqual(lineHeight * 2)
})
