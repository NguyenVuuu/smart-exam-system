import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const IV_BYTES = 12
const TAG_BYTES = 16
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function key(): Buffer {
  const value = process.env.FACE_IMAGE_ENCRYPTION_KEY
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('FACE_IMAGE_ENCRYPTION_KEY must contain 64 hexadecimal characters')
  }
  return Buffer.from(value, 'hex')
}

export function assertFaceImageEncryptionConfigured(): void {
  key()
}

export function imageMimeType(image: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (image.length < 4 || image.length > MAX_IMAGE_BYTES) return null
  if (image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) return 'image/jpeg'
  if (image[0] === 0x89 && image[1] === 0x50 && image[2] === 0x4e && image[3] === 0x47) return 'image/png'
  return null
}

export function encryptFaceImage(image: Uint8Array, context: string): Buffer {
  if (!imageMimeType(image)) throw new Error('AWS face reference image has an unsupported format')
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(context, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(image), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext])
}

export function decryptFaceImage(payload: Uint8Array, context: string): Buffer {
  if (payload.length <= IV_BYTES + TAG_BYTES) throw new Error('Stored face image is invalid')
  const bytes = Buffer.from(payload)
  const decipher = createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, IV_BYTES))
  decipher.setAAD(Buffer.from(context, 'utf8'))
  decipher.setAuthTag(bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
  const image = Buffer.concat([decipher.update(bytes.subarray(IV_BYTES + TAG_BYTES)), decipher.final()])
  if (!imageMimeType(image)) throw new Error('Stored face image is invalid')
  return image
}

export const enrollmentImageContext = (studentId: string) => `face-enrollment:${studentId}`
export const failedImageContext = (studentId: string, scheduleId: string) => `face-review:${studentId}:${scheduleId}`
