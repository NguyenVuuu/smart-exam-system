import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import { decryptField, encryptField, isEncryptionConfigured } from './encryption'

const originalKey = process.env.EXAM_ENCRYPTION_KEY

before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
})

test('AES-GCM encrypts and authenticates exam content', () => {
  const plaintext = 'Nội dung đề và đáp án'
  const first = encryptField(plaintext)
  const second = encryptField(plaintext)
  assert.match(first, /^enc:/)
  assert.notEqual(first, second)
  assert.equal(decryptField(first), plaintext)

  const parts = first.split(':')
  parts[3] = (parts[3][0] === '0' ? '1' : '0') + parts[3].slice(1)
  assert.throws(() => decryptField(parts.join(':')), /failed authentication/)
})

test('missing or malformed keys fail closed', () => {
  delete process.env.EXAM_ENCRYPTION_KEY
  assert.equal(isEncryptionConfigured(), false)
  assert.throws(() => encryptField('secret'), /EXAM_ENCRYPTION_KEY/)
  process.env.EXAM_ENCRYPTION_KEY = 'x'.repeat(64)
  assert.throws(() => encryptField('secret'), /EXAM_ENCRYPTION_KEY/)
})

test('legacy plaintext remains readable for migration', () => {
  assert.equal(decryptField('legacy value'), 'legacy value')
})
