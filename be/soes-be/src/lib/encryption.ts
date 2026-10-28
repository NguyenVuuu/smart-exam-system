/**
 * AES-256-GCM Field-Level Encryption
 *
 * Mã hóa từng field nhạy cảm trong DB (nội dung câu hỏi, đáp án).
 * Ai truy cập DB trực tiếp chỉ thấy ciphertext — không đọc được nội dung đề thi.
 *
 * Format ciphertext: enc:<iv_hex>:<authTag_hex>:<encrypted_hex>
 * Prefix "enc:" giúp phân biệt plaintext cũ (chưa encrypt) với ciphertext mới.
 *
 * Key: 32 bytes hex (256-bit) từ env EXAM_ENCRYPTION_KEY
 * Sinh key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { logger } from './logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96 bits — recommended for GCM
const TAG_LENGTH = 16  // 128 bits auth tag
const ENC_PREFIX = 'enc:'

function getKey(): Buffer | null {
  const hex = process.env.EXAM_ENCRYPTION_KEY
  if (!hex) return null
  if (hex.length !== 64) {
    logger.warn('EXAM_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Encryption disabled.')
    return null
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypt một string field. Trả về ciphertext với prefix "enc:".
 * Nếu key chưa cấu hình, trả về plaintext gốc (graceful degradation).
 */
export function encryptField(plaintext: string): string {
  const key = getKey()
  if (!key) return plaintext  // no key → store as-is (backward compat)

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt một string field.
 * - Nếu bắt đầu bằng "enc:" → decrypt
 * - Nếu không có prefix → plaintext cũ, trả về nguyên
 * - Nếu decrypt thất bại → log warning, trả về chuỗi rỗng
 */
export function decryptField(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value  // plaintext cũ

  const key = getKey()
  if (!key) {
    logger.warn('Cannot decrypt: EXAM_ENCRYPTION_KEY not configured')
    return value
  }

  try {
    const rest = value.slice(ENC_PREFIX.length)
    const parts = rest.split(':')
    if (parts.length !== 3) throw new Error('Invalid ciphertext format')

    const [ivHex, tagHex, encHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(tagHex, 'hex')
    const encrypted = Buffer.from(encHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
  } catch (error) {
    logger.error('Field decryption failed — returning empty string', { error: String(error) })
    return ''
  }
}

/**
 * Decrypt nullable field. Trả về null nếu input là null/undefined.
 */
export function decryptNullable(value: string | null | undefined): string | null {
  if (value == null) return null
  return decryptField(value)
}

/**
 * Encrypt nullable field. Trả về null nếu input là null/undefined.
 */
export function encryptNullable(value: string | null | undefined): string | null {
  if (value == null) return null
  return encryptField(value)
}

/**
 * Kiểm tra encryption có được cấu hình không.
 */
export function isEncryptionConfigured(): boolean {
  return getKey() !== null
}
