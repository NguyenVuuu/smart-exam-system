import { resolveAttemptResultReason, resolveAttemptReviewAccess } from '../../student-take-exam/services/attempt-result.policy'
import { NotFoundError } from '../../../errors/AppError'
import * as repo from '../repositories/learning-analytics.repository'
import { calculateTopicMastery, type TopicObservation } from './topic-mastery'
import { calculateQuestionQuality, type QuestionOutcome } from './question-quality'

export async function studentInsights(studentId: string, now = new Date()) {
  const found = await repo.findReleasedStudentAttempts(studentId, now)
  const attempts = found.slice(0, 50)
  const observations: TopicObservation[] = []
  let analyzedAttemptCount = 0
  for (const attempt of attempts) {
    const schedule = attempt.examSchedule
    const released = resolveAttemptResultReason({
      status: attempt.status, hasScore: true,
      resultReleaseMode: schedule.resultReleaseMode,
      resultReleaseAt: schedule.resultReleaseAt,
      resultsPublishedAt: schedule.resultsPublishedAt,
    }, now) === 'AVAILABLE'
    if (!resolveAttemptReviewAccess({
      resultAvailable: released, reviewPolicy: schedule.reviewPolicy,
      scheduleEndTime: schedule.endTime,
    }, now).available) continue
    analyzedAttemptCount += 1
    const answers = new Map(attempt.studentAnswers.map((answer) => [answer.examQuestionId, answer.score]))
    for (const item of attempt.attemptQuestions) {
      observations.push({
        questionId: item.examQuestionId,
        earnedPoints: Number(answers.get(item.examQuestionId) ?? 0),
        possiblePoints: Number(item.examQuestion.points),
        topics: item.examQuestion.topics.map(({ topicId, code, name }) => ({ id: topicId, code, name })),
      })
    }
  }
  return {
    analyzedAttemptCount,
    limitedToRecentAttempts: found.length > attempts.length,
    topics: calculateTopicMastery(observations),
  }
}

export async function teacherScheduleInsights(teacherId: string, scheduleId: string) {
  const schedule = await repo.findTeacherSchedule(teacherId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  const found = await repo.findTeacherScheduleAttempts(teacherId, scheduleId)
  const attempts = found.slice(0, 500)
  const outcomes: QuestionOutcome[] = []
  const topicObservations: TopicObservation[] = []
  for (const attempt of attempts) {
    const answers = new Map(attempt.studentAnswers.map((answer) => [answer.examQuestionId, answer.score]))
    for (const item of attempt.attemptQuestions) {
      const earnedPoints = Number(answers.get(item.examQuestionId) ?? 0)
      const possiblePoints = Number(item.examQuestion.points)
      outcomes.push({ questionId: item.examQuestionId, earnedPoints, possiblePoints })
      topicObservations.push({
        questionId: item.examQuestionId, earnedPoints, possiblePoints,
        topics: item.examQuestion.topics.map(({ topicId, code, name }) => ({ id: topicId, code, name })),
      })
    }
  }
  return {
    schedule: { id: schedule.id, title: schedule.title },
    analyzedAttemptCount: attempts.length,
    limitedToRecentAttempts: found.length > attempts.length,
    questions: calculateQuestionQuality(outcomes),
    topics: calculateTopicMastery(topicObservations),
  }
}
