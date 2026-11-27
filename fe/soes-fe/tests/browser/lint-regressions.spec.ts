import { expect, test, type Page } from '@playwright/test'

declare global { interface Window { revokedLogoUrls: string[] } }
const pageErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.text().includes('Query data cannot be undefined')) errors.push(message.text()) })
  await page.route('**/src/api/socket.ts*', route => route.fulfill({ contentType: 'application/javascript',
    body: 'export const getSocket = () => ({ on() {}, off() {} }); export function updateSocketAuthToken() {} export function disconnectSocket() {}' }))
})

test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]) })

async function installApi(page: Page, respond: (url: URL, method: string, body: string | null) => unknown | Promise<unknown>) {
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const request = route.request()
    const headers = { 'access-control-allow-origin': request.headers().origin ?? '*', 'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    const reply = await respond(new URL(request.url()), request.method(), request.postData())
    if (reply === 'unavailable') return route.fulfill({ status: 503, headers, json: { message: 'Fixture failure' } })
    await route.fulfill({ headers, json: { data: reply } })
  })
}

test('course queries ignore delayed old scope, preserve page sizes and refetch for a new owner', async ({ page }) => {
  const reads: URL[] = []
  let releaseOld: (() => void) | undefined
  const oldRead = new Promise<void>(resolve => { releaseOld = resolve })
  await installApi(page, async url => {
    reads.push(url)
    const course = url.pathname.includes('/one') ? 'one' : 'two'
    if (url.pathname.endsWith('/one')) await oldRead
    if (/\/course-offerings\/(one|two)$/.test(url.pathname)) return { subjectName: course }
    return { items: [{ id: `${course}-${url.searchParams.get('page') ?? 1}` }], pagination: { page: Number(url.searchParams.get('page') ?? 1) } }
  })
  await page.goto('/tests/browser/fixtures/lint-regressions.html')
  await expect.poll(() => reads.length).toBe(6)
  await page.getByRole('button', { name: 'Change course' }).click()
  await expect(page.getByLabel('header')).toHaveText('two')
  const oldResponse = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/one'))
  releaseOld!()
  await (await oldResponse).finished()
  await expect(page.getByLabel('header')).toHaveText('two')
  await page.getByRole('button', { name: 'Member page 2' }).click()
  await expect(page.getByLabel('members')).toContainText('two-2')
  await page.getByRole('button', { name: 'Timeline page 2' }).click()
  await expect(page.getByLabel('timeline')).toContainText('two-2')
  expect(reads.filter(url => url.pathname.endsWith('/members')).every(url => url.searchParams.get('pageSize') === '20')).toBe(true)
  expect(reads.filter(url => url.pathname.endsWith('/timeline')).every(url => url.searchParams.get('pageSize') === '10')).toBe(true)
  const before = reads.length
  await page.getByRole('button', { name: 'Change owner' }).click()
  await expect.poll(() => reads.length).toBe(before + 6)
})

test('subject filters retain resolved semester, debounce search and allow retry after failure', async ({ page }) => {
  const reads: URL[] = []
  let fail = false
  await installApi(page, url => {
    reads.push(url)
    if (fail) return 'unavailable'
    return { items: [{ subjectName: url.searchParams.get('keyword') ?? 'initial' }],
      pagination: { page: Number(url.searchParams.get('page') ?? 1) }, semesterOptions: [], currentSemesterId: 'semester-one' }
  })
  await page.goto('/tests/browser/fixtures/lint-regressions.html?mode=subjects')
  await expect.poll(() => reads.length).toBe(2)
  await page.getByRole('button', { name: 'Page 2', exact: true }).click()
  await expect.poll(() => reads.at(-1)?.searchParams.get('page')).toBe('2')
  expect(reads.at(-1)?.searchParams.get('semesterId')).toBe('semester-one')
  await page.getByLabel('search').fill('java')
  await expect(page.getByLabel('subjects')).toContainText('java')
  expect(reads.at(-1)?.searchParams.get('page')).toBe('1')
  fail = true
  await page.getByRole('button', { name: 'Change semester' }).click()
  await expect(page.getByLabel('error')).not.toBeEmpty()
  fail = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByLabel('error')).toBeEmpty()
  expect(reads.at(-1)?.searchParams.get('semesterId')).toBe('semester-two')
})

test('semester create and activate update the displayed collection', async ({ page }) => {
  const semester = { id: 'first', name: 'First', code: 'first', academicYear: '2026-2027', term: 'TERM_1',
    startDate: '2026-09-01', endDate: '2026-12-31', status: 'ACTIVE' }
  await installApi(page, (_url, method) => method === 'GET' ? { items: [semester] }
    : { ...semester, id: 'second', name: 'Second', status: method === 'PATCH' ? 'ACTIVE' : 'PLANNED' })
  await page.goto('/tests/browser/fixtures/lint-regressions.html?mode=semesters')
  await expect(page.getByLabel('semesters')).toContainText('First')
  await page.getByRole('button', { name: 'Create semester' }).click()
  await expect(page.getByLabel('semesters')).toContainText('Second')
  await page.getByRole('button', { name: 'Activate second' }).click()
  await expect.poll(async () => JSON.parse(await page.getByLabel('semesters').innerText())).toMatchObject([
    { id: 'first', isCurrent: false, status: 'CLOSED' }, { id: 'second', isCurrent: true, status: 'ACTIVE' },
  ])
})

test('appeal submission remains limited to one and keeps the reason payload', async ({ page }) => {
  const writes: unknown[] = []
  await installApi(page, (_url, method, body) => {
    if (method === 'GET') return { items: [] }
    writes.push(JSON.parse(body ?? '{}'))
    return { id: 'appeal', status: 'PENDING', reason: 'Please review the score' }
  })
  await page.goto('/tests/browser/fixtures/lint-regressions.html?mode=appeals')
  await page.getByLabel('reason').fill('Please review the score')
  await page.getByRole('button', { name: 'Submit appeal' }).click()
  await expect(page.getByLabel('appeals')).toContainText('PENDING')
  await page.getByRole('button', { name: 'Submit appeal' }).click()
  expect(writes).toEqual([{ reason: 'Please review the score' }])
})

test('sidebar works without storage and face profile state resets only for the new scope', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { value: { getItem() { throw new Error('Unavailable') }, setItem() { throw new Error('Unavailable') } } })
  })
  const faceReads: string[] = []
  await installApi(page, url => {
    faceReads.push(url.searchParams.get('scheduleId') ?? '')
    return { failedAttemptsSinceSuccess: url.searchParams.get('scheduleId') === 'one' ? 2 : 0, cooldownUntil: null, requiresManualReview: false }
  })
  await page.goto('/tests/browser/fixtures/lint-regressions.html?mode=appearance')
  await expect(page.getByText('Lượt 1/2 · Còn 1 lần thử.')).toBeVisible()
  await page.getByRole('button', { name: 'Settings route', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cấu hình', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Toggle sidebar' }).click()
  await page.getByRole('button', { name: 'Toggle sidebar' }).click()
  await page.getByRole('button', { name: 'Change face scope' }).click()
  await expect(page.getByText('Lượt 1/2 · Còn 3 lần thử.')).toBeVisible()
  expect(faceReads).toEqual(['one', 'two'])
})

test('logo preview revokes old object URLs when selecting and reverting a file', async ({ page }) => {
  await page.addInitScript(() => {
    window.revokedLogoUrls = []
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.revokeObjectURL = url => { window.revokedLogoUrls.push(url); revoke(url) }
  })
  await installApi(page, () => ({ failedAttemptsSinceSuccess: 0, cooldownUntil: null, requiresManualReview: false }))
  await page.goto('/tests/browser/fixtures/lint-regressions.html?mode=appearance')
  const image = page.getByAltText('Logo xem trước')
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=', 'base64')
  await page.locator('input[type=file]').setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer })
  await expect(image).toHaveAttribute('src', /^blob:/)
  const first = await image.getAttribute('src')
  await page.locator('input[type=file]').setInputFiles({ name: 'two.png', mimeType: 'image/png', buffer })
  await expect(image).not.toHaveAttribute('src', first!)
  expect(await page.evaluate(() => window.revokedLogoUrls)).toContain(first)
  const second = await image.getAttribute('src')
  await page.getByRole('button', { name: 'Khôi phục ảnh cũ', exact: true }).click()
  await expect(image).toHaveAttribute('src', '/saved-logo.png')
  expect(await page.evaluate(() => window.revokedLogoUrls)).toContain(second)
})
