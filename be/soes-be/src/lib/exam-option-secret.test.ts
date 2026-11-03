import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import { encryptField } from './encryption'
import { openExamOption, sealExamOption } from './exam-option-secret'

const originalKey = process.env.EXAM_ENCRYPTION_KEY
before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
})

test('answer flag is stored only inside AES ciphertext', () => {
  const sealed = sealExamOption('Lựa chọn đúng', true)
  assert.equal(sealed.isCorrect, false)
  assert.doesNotMatch(JSON.stringify(sealed), /Lựa chọn đúng/)
  assert.deepEqual(openExamOption(sealed), { content: 'Lựa chọn đúng', isCorrect: true, sealed: true })
})

test('legacy exam options remain readable for conversion', () => {
  assert.deepEqual(openExamOption({ content: encryptField('Old answer'), isCorrect: true }),
    { content: 'Old answer', isCorrect: true, sealed: false })
})
