import { expect, test } from '@playwright/test'

const attemptId = 'fixture-attempt'
const examPath = '/student/course-offerings/course/exam-schedules/schedule/take'

test('restores saved selections and autosaves only the changed answer after the debounce', async ({ page }) => {
  const writes: unknown[] = []
  await page.addInitScript(id => {
    if (location.pathname.endsWith('/take')) history.replaceState({ idx: 0, usr: { attemptId: id } }, '')
  }, attemptId)
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const origin = request.headers().origin ?? '*'
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization, content-type, x-exam-face-grant',
      'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    let data: unknown = {}
    if (path.endsWith('/auth/refresh-token')) data = { accessToken: 'fixture-token' }
    if (path.endsWith('/auth/me')) data = { id: 'student', fullName: 'Fixture', role: 'STUDENT' }
    if (path.endsWith('/student/face/profile')) data = { enabled: false }
    if (path.endsWith('/attempts/' + attemptId)) {
      data = {
        attemptId, title: 'Fixture exam', durationMinutes: 30, remainingSeconds: 1800,
        deadlineAt: new Date(Date.now() + 1_800_000).toISOString(),
        questions: [
          { id: 'q1', orderIndex: 1, type: 'MULTIPLE_CHOICE', content: 'Fixture question', points: 1, answer: ['a'],
            options: [{ id: 'a', content: 'Alpha' }, { id: 'b', content: 'Bravo' }] },
          { id: 'q2', orderIndex: 2, type: 'SINGLE_CHOICE', content: 'Other question', points: 1, answer: ['c'],
            options: [{ id: 'c', content: 'Charlie' }] },
        ],
      }
    }
    if (path.endsWith('/answers')) writes.push(request.postDataJSON())
    await route.fulfill({ headers, json: { success: true, data } })
  })
  await page.goto(examPath)
  await expect(page.locator('body')).toContainText('Fixture question')
  const alpha = page.locator('#answer-q1-a')
  const bravo = page.locator('#answer-q1-b')
  await expect(alpha).toBeChecked()
  await bravo.check()
  await bravo.uncheck()
  await alpha.uncheck()
  expect(writes).toEqual([])
  await expect.poll(() => writes).toEqual([{ questionId: 'q1', answer: [] }])
})
