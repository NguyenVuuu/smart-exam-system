import { ValidationError } from '../../../errors/AppError'

export function assertApprovedQuestionTopics(
  questions: { subjectId: string; topicIds: string[] }[],
  topics: { id: string; subjectId: string }[],
) {
  const subjectsByTopic = new Map(topics.map((topic) => [topic.id, topic.subjectId]))
  if (questions.some((question) => question.topicIds.some((id) =>
    subjectsByTopic.get(id) !== question.subjectId))) {
    throw new ValidationError('Question topic does not belong to its subject')
  }
}
