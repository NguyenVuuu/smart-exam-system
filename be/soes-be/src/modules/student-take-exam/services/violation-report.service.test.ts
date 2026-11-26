import assert from 'node:assert/strict'
import Module from 'node:module'
import { Readable } from 'node:stream'
import { test } from 'node:test'

test('phone evidence retry preserves one violation and concurrent duplicate uploads emit once', async context => {
  const paths = ['../repositories/attempt-violation.repository', '../../../lib/minio', '../../../lib/redis', './violation-events']
  const ids = paths.map(path => require.resolve(path))
  const originals = ids.map(id => require.cache[id])
  const serviceId = require.resolve('./violation-report.service')
  let uploads = 0
  let emitted = 0
  let created = 0
  let status = 'IN_PROGRESS'
  const saved = new Map<string, Record<string, unknown>>()
  const repository = {
    findAttemptForViolation: async () => ({
      status, deadlineAt: new Date(Date.now() + 60_000), studentId: 'student',
      student: { studentCode: 'fixture', user: { fullName: 'Fixture' } },
      examSchedule: { enableWebcam: true, proctoringStoragePath: 'fixture' },
    }),
    findRecordedViolation: async (id: string) => saved.get(id) ?? null,
    createViolation: async (input: { id: string; violationType: string; severity: string; detectedAt: Date }) => {
      if (saved.has(input.id)) throw Object.assign(new Error('duplicate'), { code: 'P2002' })
      created += 1
      const row = { ...input, endedAt: input.detectedAt, durationSeconds: 0,
        evidenceUrls: ['object.jpg'], evidenceIds: ['evidence'] }
      saved.set(input.id, row)
      return row
    },
  }
  const modules = [repository, {
    uploadViolationEvidenceFiles: async () => { uploads += 1; return ['object.jpg'] },
    saveViolationEvidenceFilesLocal: async () => { assert.fail('storage fallback was not expected') },
  }, { __esModule: true, default: { incr: async () => 1, expire: async () => 1 } }, {
    emitViolationCreatedFromAttempt: async () => { emitted += 1 }, emitViolationEnded: () => undefined,
  }]
  ids.forEach((id, index) => { const stub = new Module(id); stub.exports = modules[index]; require.cache[id] = stub })
  context.after(() => {
    ids.forEach((id, index) => {
      if (originals[index]) require.cache[id] = originals[index]
      else delete require.cache[id]
    })
    delete require.cache[serviceId]
  })
  const { recordViolation } = await import('./violation-report.service')
  const buffer = Buffer.from('same captured frame')
  const file: Express.Multer.File = {
    fieldname: 'evidence', originalname: 'frame.jpg', encoding: '7bit', mimetype: 'image/jpeg',
    buffer, size: buffer.length, stream: Readable.from(buffer), destination: '', filename: '', path: '',
  }
  const payload = { violationType: 'PHONE_DETECTED', metadata: { capturedAt: '2026-11-26T00:00:00Z' } }
  const results = await Promise.all([1, 2].map(() => recordViolation('schedule', 'attempt', 'student', payload, [file])))
  assert.equal(results[0].id, results[1].id)
  assert.equal(created, 1)
  assert.equal(emitted, 1)
  const uploaded = uploads
  status = 'SUBMITTED'
  assert.equal((await recordViolation('schedule', 'attempt', 'student', payload, [file])).id, results[0].id)
  assert.equal(uploads, uploaded)
  assert.equal(created, 1)
})
