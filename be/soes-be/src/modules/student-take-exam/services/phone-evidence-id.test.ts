import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { phoneEvidenceId } from './phone-evidence-id'

test('the same captured evidence can retry while different frames and attempts remain distinct', () => {
  const metadata = { capturedAt: '2026-11-26T00:00:00Z', confidence: 0.9 }
  const image = Buffer.from('captured frame')
  const id = phoneEvidenceId('attempt', metadata, image)
  assert.equal(z.string().uuid().parse(id), id)
  assert.equal(phoneEvidenceId('attempt', { ...metadata }, Buffer.from(image)), id)
  assert.notEqual(phoneEvidenceId('another', metadata, image), id)
  assert.notEqual(phoneEvidenceId('attempt', { ...metadata, capturedAt: '2026-11-26T00:00:01Z' }, image), id)
  assert.notEqual(phoneEvidenceId('attempt', metadata, Buffer.from('another frame')), id)
})
