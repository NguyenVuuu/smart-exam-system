import { randomUUID } from 'node:crypto'
import type { AttemptEndedBy, Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { ConflictError } from '../../../errors/AppError'

export interface GradingClaim {
  id: string
  gradingClaimToken: string
  endedBy: AttemptEndedBy | null
  submittedAt: Date | null
}

export function assertGradingStorageReady() {
  return prisma.$queryRaw`
    SELECT "gradingPending", "gradingClaimToken", "gradingLeaseUntil", "gradingRetryAt", "gradingFailures"
    FROM "ExamAttempt" LIMIT 0
  `
}

export async function claimGradingJob(): Promise<GradingClaim | null> {
  const rows = await prisma.$queryRaw<GradingClaim[]>`
    WITH candidate AS (
      SELECT "id" FROM "ExamAttempt"
      WHERE "gradingPending" = true AND "gradingFailures" < 5
        AND "status" IN ('SUBMITTED', 'AUTO_SUBMITTED', 'GRADING')
        AND ("gradingRetryAt" IS NULL OR "gradingRetryAt" <= clock_timestamp())
        AND ("gradingLeaseUntil" IS NULL OR "gradingLeaseUntil" <= clock_timestamp())
      ORDER BY "submittedAt", "id" LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    UPDATE "ExamAttempt" AS attempt SET "gradingClaimToken" = ${randomUUID()},
      "gradingLeaseUntil" = clock_timestamp() + interval '90 seconds'
    FROM candidate WHERE attempt."id" = candidate."id"
    RETURNING attempt."id", attempt."gradingClaimToken", attempt."endedBy", attempt."submittedAt"
  `
  return rows[0] ?? null
}

export async function assertGradingClaim(tx: Prisma.TransactionClient, attemptId: string, token?: string) {
  if (!token) return
  const [attempt] = await tx.$queryRaw<Array<{ valid: boolean }>>`
    SELECT ("gradingPending" = true AND "gradingClaimToken" = ${token}
      AND "gradingLeaseUntil" > clock_timestamp()
      AND "status" IN ('SUBMITTED', 'AUTO_SUBMITTED', 'GRADING')) AS valid
    FROM "ExamAttempt" WHERE "id" = ${attemptId} FOR UPDATE
  `
  if (!attempt?.valid) throw new ConflictError('Grading ownership has changed')
}

export function renewGradingClaim(claim: GradingClaim) {
  return prisma.$executeRaw`
    UPDATE "ExamAttempt" SET "gradingLeaseUntil" = clock_timestamp() + interval '90 seconds'
    WHERE "id" = ${claim.id} AND "gradingClaimToken" = ${claim.gradingClaimToken}
      AND "gradingPending" = true AND "gradingLeaseUntil" > clock_timestamp()
      AND "status" IN ('SUBMITTED', 'AUTO_SUBMITTED', 'GRADING')
  `
}

export function failGradingClaim(claim: GradingClaim) {
  return prisma.$executeRaw`
    UPDATE "ExamAttempt" SET "gradingFailures" = "gradingFailures" + 1,
      "gradingClaimToken" = NULL, "gradingLeaseUntil" = NULL, "status" = 'GRADING',
      "gradingRetryAt" = clock_timestamp() + LEAST(300, 5 * power(2, "gradingFailures")) * interval '1 second'
    WHERE "id" = ${claim.id} AND "gradingClaimToken" = ${claim.gradingClaimToken}
      AND "gradingPending" = true AND "status" IN ('SUBMITTED', 'AUTO_SUBMITTED', 'GRADING')
  `
}
