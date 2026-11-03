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

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96 bits — recommended for GCM
const TAG_LENGTH = 16  // 128 bits auth tag
const ENC_PREFIX = 'enc:'

function getKey(): Buffer {
  const hex = process.env.EXAM_ENCRYPTION_KEY
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('EXAM_ENCRYPTION_KEY must be a 32-byte hexadecimal key')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypt một string field. Trả về ciphertext với prefix "enc:".
 * Không bao giờ lưu plaintext khi thiếu khóa.
 */
export function encryptField(plaintext: string): string {
  const key = getKey()

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
 * - Dữ liệu cũ chưa mã hóa được đọc để phục vụ chuyển đổi dữ liệu.
 * - Ciphertext lỗi hoặc thiếu khóa phải báo lỗi.
 */
export function decryptField(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value  // plaintext cũ

  const key = getKey()

  try {
    const rest = value.slice(ENC_PREFIX.length)
    const parts = rest.split(':')
    if (parts.length !== 3) throw new Error('Invalid ciphertext format')

    const [ivHex, tagHex, encHex] = parts
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(tagHex)
      || (encHex.length > 0 && !/^[0-9a-fA-F]+$/.test(encHex))) {
      throw new Error('Invalid ciphertext encoding')
    }
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(tagHex, 'hex')
    const encrypted = Buffer.from(encHex, 'hex')
    if (iv.length !== IV_LENGTH || authTag.length !== TAG_LENGTH) {
      throw new Error('Invalid ciphertext length')
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error('Encrypted exam data failed authentication')
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
  return Boolean(process.env.EXAM_ENCRYPTION_KEY && /^[0-9a-fA-F]{64}$/.test(process.env.EXAM_ENCRYPTION_KEY))
}
