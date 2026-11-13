export interface QuestionOutcome {
  questionId: string
  title: string
  earnedPoints: number
  possiblePoints: number
}

export interface QuestionQuality {
  questionId: string
  title: string
  exposureCount: number
  averagePercentage: number
  signal: 'INSUFFICIENT_DATA' | 'VERY_HARD' | 'VERY_EASY' | 'NORMAL'
}

const MIN_RESPONSES = 20

export function calculateQuestionQuality(outcomes: QuestionOutcome[]): QuestionQuality[] {
  const groups = new Map<string, { title: string; count: number; earned: number; possible: number }>()
  for (const row of outcomes) {
    if (!Number.isFinite(row.possiblePoints) || row.possiblePoints <= 0
      || !Number.isFinite(row.earnedPoints)) continue
    const group = groups.get(row.questionId) ?? { title: row.title, count: 0, earned: 0, possible: 0 }
    group.count += 1
    group.earned += Math.max(0, Math.min(row.earnedPoints, row.possiblePoints))
    group.possible += row.possiblePoints
    groups.set(row.questionId, group)
  }
  return [...groups].map(([questionId, group]) => {
    const averagePercentage = Math.round((group.earned / group.possible) * 100)
    return {
      questionId, title: group.title, exposureCount: group.count, averagePercentage,
      signal: group.count < MIN_RESPONSES ? 'INSUFFICIENT_DATA' as const
        : averagePercentage < 30 ? 'VERY_HARD' as const
        : averagePercentage > 90 ? 'VERY_EASY' as const : 'NORMAL' as const,
    }
  }).sort((a, b) => a.averagePercentage - b.averagePercentage)
}
