import type { ResultReleaseMode } from '@prisma/client'

interface ResultReleaseConfig {
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: Date | null
  resultsPublishedAt: Date | null
}

export function isResultReleased(config: ResultReleaseConfig, now = new Date()): boolean {
  switch (config.resultReleaseMode) {
    case 'IMMEDIATE':
      return true
    case 'MANUAL':
      return config.resultsPublishedAt !== null
    default:
      return false
  }
}

export function releasedResultScheduleWhere(now = new Date()) {
  return {
    OR: [
      { resultReleaseMode: 'IMMEDIATE' as const },
      { resultReleaseMode: 'MANUAL' as const, resultsPublishedAt: { not: null } },
    ],
  }
}
