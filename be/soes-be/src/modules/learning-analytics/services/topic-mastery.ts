export interface TopicObservation {
  questionId: string
  earnedPoints: number
  possiblePoints: number
  topics: Array<{ id: string; code: string; name: string }>
}

export interface TopicMastery {
  topicId: string
  code: string
  name: string
  questionCount: number
  earnedPoints: number
  possiblePoints: number
  percentage: number
  sufficientData: boolean
}

const MIN_QUESTION_COUNT = 5

export function calculateTopicMastery(observations: TopicObservation[]): TopicMastery[] {
  const totals = new Map<string, Omit<TopicMastery, 'percentage' | 'sufficientData'>>()
  for (const observation of observations) {
    if (!Number.isFinite(observation.possiblePoints) || observation.possiblePoints <= 0
      || !Number.isFinite(observation.earnedPoints)) continue
    const earned = Math.min(observation.possiblePoints, Math.max(0, observation.earnedPoints))
    for (const topic of observation.topics) {
      const current = totals.get(topic.id) ?? {
        topicId: topic.id, code: topic.code, name: topic.name,
        questionCount: 0, earnedPoints: 0, possiblePoints: 0,
      }
      current.questionCount += 1
      current.earnedPoints += earned
      current.possiblePoints += observation.possiblePoints
      totals.set(topic.id, current)
    }
  }
  return [...totals.values()].map((topic) => ({
    ...topic,
    percentage: Math.round((topic.earnedPoints / topic.possiblePoints) * 100),
    sufficientData: topic.questionCount >= MIN_QUESTION_COUNT,
  })).sort((a, b) => a.percentage - b.percentage || a.code.localeCompare(b.code))
}
