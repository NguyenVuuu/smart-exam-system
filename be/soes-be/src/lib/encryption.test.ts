import assert from 'node:assert/strict'
import { createCipheriv, randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import { decryptField, encryptField, isEncryptionConfigured } from './encryption'

const originalKey = process.env.EXAM_ENCRYPTION_KEY
const originalKeyId = process.env.EXAM_ENCRYPTION_KEY_ID
const originalKeyring = process.env.EXAM_DECRYPTION_KEYS
const originalLegacyKey = process.env.EXAM_LEGACY_ENCRYPTION_KEY

before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
  if (originalKeyId === undefined) delete process.env.EXAM_ENCRYPTION_KEY_ID
  else process.env.EXAM_ENCRYPTION_KEY_ID = originalKeyId
  if (originalKeyring === undefined) delete process.env.EXAM_DECRYPTION_KEYS
  else process.env.EXAM_DECRYPTION_KEYS = originalKeyring
  if (originalLegacyKey === undefined) delete process.env.EXAM_LEGACY_ENCRYPTION_KEY
  else process.env.EXAM_LEGACY_ENCRYPTION_KEY = originalLegacyKey
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
  assert.throws(() => encryptField('secret'), /Exam encryption key/)
  process.env.EXAM_ENCRYPTION_KEY = 'x'.repeat(64)
  assert.throws(() => encryptField('secret'), /Exam encryption key/)
})

test('key ID selects the right key after rotation', () => {
  const firstKey = randomBytes(32).toString('hex')
  const secondKey = randomBytes(32).toString('hex')
  process.env.EXAM_ENCRYPTION_KEY_ID = 'key_1'
  process.env.EXAM_ENCRYPTION_KEY = firstKey
  const oldCiphertext = encryptField('first version')
  assert.match(oldCiphertext, /^enc:v2:key_1:/)
  process.env.EXAM_ENCRYPTION_KEY_ID = 'key_2'
  process.env.EXAM_ENCRYPTION_KEY = secondKey
  process.env.EXAM_DECRYPTION_KEYS = JSON.stringify({ key_1: firstKey })
  assert.equal(decryptField(oldCiphertext), 'first version')
  delete process.env.EXAM_DECRYPTION_KEYS
  assert.throws(() => decryptField(oldCiphertext), /failed authentication/)
  delete process.env.EXAM_ENCRYPTION_KEY_ID
})

test('legacy ciphertext can be read with a separate legacy key', () => {
  const legacyKey = randomBytes(32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', legacyKey, iv)
  const body = Buffer.concat([cipher.update('legacy secret', 'utf8'), cipher.final()])
  const encoded = `enc:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${body.toString('hex')}`
  process.env.EXAM_LEGACY_ENCRYPTION_KEY = legacyKey.toString('hex')
  assert.equal(decryptField(encoded), 'legacy secret')
  delete process.env.EXAM_LEGACY_ENCRYPTION_KEY
})

test('legacy plaintext remains readable for migration', () => {
  assert.equal(decryptField('legacy value'), 'legacy value')
})
