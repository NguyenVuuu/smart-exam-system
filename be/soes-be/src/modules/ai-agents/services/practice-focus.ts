import type { TopicMastery } from '../../learning-analytics/services/topic-mastery'

export function selectWeakPracticeTopic(topics: TopicMastery[], topicId: string, subjectId: string) {
  return topics.find((topic) => topic.topicId === topicId && topic.subjectId === subjectId
    && topic.needsPractice)
}
