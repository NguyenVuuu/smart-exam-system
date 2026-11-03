/**
 * AES-256-GCM Field-Level Encryption
 *
 * Mã hóa từng field nhạy cảm trong DB (nội dung câu hỏi, đáp án).
 * Ai truy cập DB trực tiếp chỉ thấy ciphertext — không đọc được nội dung đề thi.
 *
 * New format: enc:v2:<keyId>:<iv_hex>:<authTag_hex>:<encrypted_hex>.
 * Legacy format enc:<iv_hex>:<authTag_hex>:<encrypted_hex> remains readable for migration.
 *
 * Primary key: EXAM_ENCRYPTION_KEY; retired keys: EXAM_DECRYPTION_KEYS.
 * Sinh key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96 bits — recommended for GCM
const TAG_LENGTH = 16  // 128 bits auth tag
const ENC_PREFIX = 'enc:'
const FORMAT_VERSION = 'v2'

function parseKey(hex: string | undefined): Buffer {
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Exam encryption key must be a 32-byte hexadecimal key')
  }
  return Buffer.from(hex, 'hex')
}

function currentKeyId(): string {
  const id = process.env.EXAM_ENCRYPTION_KEY_ID || 'primary'
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(id)) throw new Error('Invalid exam encryption key ID')
  return id
}

function getCurrentKey(): Buffer {
  return parseKey(process.env.EXAM_ENCRYPTION_KEY)
}

function getDecryptKey(id: string): Buffer {
  if (id === currentKeyId()) return getCurrentKey()
  const keyring = process.env.EXAM_DECRYPTION_KEYS
  if (!keyring) throw new Error('Exam decryption key is unavailable')
  const parsed: unknown = JSON.parse(keyring)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid exam decryption keyring')
  const hex = (parsed as Record<string, unknown>)[id]
  if (typeof hex !== 'string') throw new Error('Exam decryption key is unavailable')
  return parseKey(hex)
}

/**
 * Encrypt một string field. Trả về ciphertext với prefix "enc:".
 * Không bao giờ lưu plaintext khi thiếu khóa.
 */
export function encryptField(plaintext: string): string {
  const key = getCurrentKey()

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${ENC_PREFIX}${FORMAT_VERSION}:${currentKeyId()}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
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

  try {
    const rest = value.slice(ENC_PREFIX.length)
    const parts = rest.split(':')
    const versioned = parts[0] === FORMAT_VERSION
    if (versioned ? parts.length !== 5 : parts.length !== 3) throw new Error('Invalid ciphertext format')

    const key = versioned
      ? getDecryptKey(parts[1])
      : parseKey(process.env.EXAM_LEGACY_ENCRYPTION_KEY || process.env.EXAM_ENCRYPTION_KEY)
    const [ivHex, tagHex, encHex] = versioned ? parts.slice(2) : parts
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
  try {
    getCurrentKey()
    currentKeyId()
    return true
  } catch {
    return false
  }
}
