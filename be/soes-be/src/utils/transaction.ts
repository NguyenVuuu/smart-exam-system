import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

const retryableCodes = new Set(['P2034'])

export async function runSerializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && retryableCodes.has(error.code)
      if (!retryable || attempt === 3) throw error
    }
  }
  throw new Error('Transaction retry limit reached')
}
