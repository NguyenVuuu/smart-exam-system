import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/** Pad a number with leading zeros to the given length */
export function padCode(n: number, digits: number): string {
  return String(n).padStart(digits, '0')
}

export const DEFAULT_PASSWORD = '123456'
