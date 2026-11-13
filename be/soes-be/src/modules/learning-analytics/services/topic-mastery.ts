export interface TopicObservation {
  questionId: string
  earnedPoints: number
  possiblePoints: number
  topics: Array<{ id: string; code: string; name: string; subjectId: string }>
}

export interface TopicMastery {
  topicId: string
  subjectId: string
  code: string
  name: string
  questionCount: number
  earnedPoints: number
  possiblePoints: number
  percentage: number
  sufficientData: boolean
  needsPractice: boolean
}

const MIN_QUESTION_COUNT = 5
const MIN_DISTINCT_QUESTIONS = 3
const WEAK_TOPIC_PERCENTAGE = 70

export function calculateTopicMastery(observations: TopicObservation[]): TopicMastery[] {
  const totals = new Map<string, Omit<TopicMastery, 'percentage' | 'sufficientData' | 'needsPractice'>
    & { questionIds: Set<string> }>()
  for (const observation of observations) {
    if (!Number.isFinite(observation.possiblePoints) || observation.possiblePoints <= 0
      || !Number.isFinite(observation.earnedPoints)) continue
    const earned = Math.min(observation.possiblePoints, Math.max(0, observation.earnedPoints))
    for (const topic of observation.topics) {
      const current = totals.get(topic.id) ?? {
        topicId: topic.id, subjectId: topic.subjectId, code: topic.code, name: topic.name,
        questionCount: 0, questionIds: new Set<string>(), earnedPoints: 0, possiblePoints: 0,
      }
      current.questionCount += 1
      current.questionIds.add(observation.questionId)
      current.earnedPoints += earned
      current.possiblePoints += observation.possiblePoints
      totals.set(topic.id, current)
    }
  }
  return [...totals.values()].map((topic) => {
    const percentage = Math.round((topic.earnedPoints / topic.possiblePoints) * 100)
    const sufficientData = topic.questionCount >= MIN_QUESTION_COUNT
      && topic.questionIds.size >= MIN_DISTINCT_QUESTIONS
    const { questionIds: _questionIds, ...counts } = topic
    return { ...counts, percentage, sufficientData,
      needsPractice: sufficientData && percentage < WEAK_TOPIC_PERCENTAGE }
  }).sort((a, b) => a.percentage - b.percentage || a.code.localeCompare(b.code))
}
