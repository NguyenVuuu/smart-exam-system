import { expect, test } from '@playwright/test'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64')
const endpoint = '**/api/teacher/proctoring/schedules/schedule/violations/violation/evidence/image'

test('protected evidence uses the backend and bearer authentication, then releases the blob on close', async ({ page }) => {
  let requests = 0
  await page.addInitScript(() => {
    const original = URL.revokeObjectURL
    Object.assign(window, { revokedEvidence: [] as string[] })
    URL.revokeObjectURL = url => {
      (window as unknown as { revokedEvidence: string[] }).revokedEvidence.push(url)
      original(url)
    }
  })
  await page.route(endpoint, async route => {
    requests++
    expect(new URL(route.request().url()).port).toBe('3000')
    expect(route.request().headers().authorization).toBe('Bearer evidence-test-token')
    expect(new URL(route.request().url()).searchParams.has('token')).toBe(false)
    await route.fulfill({ contentType: 'image/png', body: png })
  })
  await page.goto('/tests/browser/fixtures/evidence-image.html')
  const image = page.getByRole('img')
  await expect(image).toHaveAttribute('src', /^blob:/)
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(1)
  const source = await image.getAttribute('src')
  await page.getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { revokedEvidence: string[] }).revokedEvidence)).toContain(source)
  expect(requests).toBe(1)
})

test('a failed evidence fetch displays an error and retries without showing a broken image', async ({ page }) => {
  let requests = 0
  await page.route(endpoint, async route => {
    requests++
    if (requests === 1) await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
    else await route.fulfill({ contentType: 'image/png', body: png })
  })
  await page.goto('/tests/browser/fixtures/evidence-image.html')
  await expect(page.getByRole('alert')).toContainText('Không tải được ảnh bằng chứng')
  await expect(page.getByRole('img')).toHaveCount(0)
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('img')).toHaveAttribute('src', /^blob:/)
  expect(requests).toBe(2)
})

test('signed storage URLs remain direct image requests and never receive the bearer token', async ({ page }) => {
  await page.route('https://storage.example/evidence.png?signature=test', async route => {
    expect(route.request().headers().authorization).toBeUndefined()
    await route.fulfill({ contentType: 'image/png', body: png })
  })
  const url = 'https://storage.example/evidence.png?signature=test'
  await page.goto(`/tests/browser/fixtures/evidence-image.html?image=${encodeURIComponent(url)}`)
  const image = page.getByRole('img')
  await expect(image).toHaveAttribute('src', url)
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(1)
})

test('legacy local evidence is fetched with a header instead of a token in the URL', async ({ page }) => {
  await page.route('**/api/local-evidence/violations/image.jpg', async route => {
    expect(route.request().headers().authorization).toBe('Bearer evidence-test-token')
    expect(route.request().url()).not.toContain('token=')
    await route.fulfill({ contentType: 'image/png', body: png })
  })
  const url = '/api/local-evidence/violations/image.jpg?token=legacy-token'
  await page.goto(`/tests/browser/fixtures/evidence-image.html?image=${encodeURIComponent(url)}`)
  await expect(page.getByRole('img')).toHaveAttribute('src', /^blob:/)
})

test('a non-image success response is rejected instead of rendering a broken blob image', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ contentType: 'text/html', body: '<html>Application</html>' }))
  await page.goto('/tests/browser/fixtures/evidence-image.html')
  await expect(page.getByRole('alert')).toContainText('Không tải được ảnh bằng chứng')
  await expect(page.getByRole('img')).toHaveCount(0)
})
