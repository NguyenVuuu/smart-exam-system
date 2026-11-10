import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, describe, it } from 'node:test'
import { decryptFaceImage, encryptFaceImage, enrollmentImageContext, failedImageContext, imageMimeType } from './face-image.crypto'

const previousKey = process.env.FACE_IMAGE_ENCRYPTION_KEY
before(() => { process.env.FACE_IMAGE_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (previousKey === undefined) delete process.env.FACE_IMAGE_ENCRYPTION_KEY
  else process.env.FACE_IMAGE_ENCRYPTION_KEY = previousKey
})

describe('face image encryption', () => {
  const image = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01])

  it('encrypts images without storing plaintext and binds ciphertext to student and schedule', () => {
    const context = failedImageContext('student-1', 'schedule-1')
    const encrypted = encryptFaceImage(image, context)
    assert.equal(encrypted.includes(image), false)
    assert.deepEqual(decryptFaceImage(encrypted, context), image)
    assert.throws(() => decryptFaceImage(encrypted, failedImageContext('student-2', 'schedule-1')))
    assert.throws(() => decryptFaceImage(encrypted, enrollmentImageContext('student-1')))
  })

  it('rejects altered ciphertext and unsupported image bytes', () => {
    const encrypted = encryptFaceImage(image, enrollmentImageContext('student-1'))
    encrypted[encrypted.length - 1] ^= 1
    assert.throws(() => decryptFaceImage(encrypted, enrollmentImageContext('student-1')))
    assert.equal(imageMimeType(Buffer.from('not an image')), null)
    assert.throws(() => encryptFaceImage(Buffer.from('not an image'), enrollmentImageContext('student-1')))
  })
})
