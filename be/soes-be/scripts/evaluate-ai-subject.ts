/** Read-only evaluation on a real subject bank. Prints aggregates, never question text or answer keys. */
import 'dotenv/config'
import { decryptField } from '../src/lib/encryption'
import prisma from '../src/lib/prisma'
import { findAutoExamQuestionPool } from '../src/modules/teacher-exams/repositories/teacher-exams.repository'
import { requestExamDraftAgent, requestTopicSuggestionAgent } from '../src/modules/ai-agents/services/ai-agent.client'
import { candidateRequiresReview, defaultTopicTargets, validateExamDraftSelection } from '../src/modules/ai-agents/services/exam-draft.service'

async function main() {
  const subjectArg = process.argv.indexOf('--subject-id')
  const requestedSubjectId = subjectArg >= 0 ? process.argv[subjectArg + 1] : undefined
  const subjects = await prisma.subject.findMany({
    where: requestedSubjectId ? { id: requestedSubjectId } : { questions: { some: { archivedAt: null } } },
    select: { id: true, code: true, departmentId: true, _count: { select: { questions: true } } },
    orderBy: { code: 'asc' },
  })
  const banks = []
  for (const subject of subjects) {
    const teachers = await prisma.teacher.findMany({
      where: { departmentId: subject.departmentId, status: 'ACTIVE' }, select: { id: true },
    })
    if (!teachers.length) continue
    const ownership = await prisma.question.groupBy({ by: ['ownerId'],
      where: { subjectId: subject.id, archivedAt: null, ownerId: { in: teachers.map(({ id }) => id) } },
      _count: { _all: true }, orderBy: { _count: { id: 'desc' } }, take: 1 })
    const teacherId = ownership[0]?.ownerId ?? teachers[0].id
    const pool = await findAutoExamQuestionPool(teacherId, {
      subjectId: subject.id, format: 'OBJECTIVE', sourceScope: 'BOTH', selectedQuestionIds: [],
    })
    if (!pool.length) continue
    const sampled = pool.slice(0, 500)
    const candidates = sampled.filter((question) => !candidateRequiresReview(question))
    const labeled = candidates.filter((question) => question.topics.length > 0)
    const report: Record<string, unknown> = {
      subjectCode: subject.code, candidateCount: candidates.length,
      reviewedOutCount: sampled.length - candidates.length,
      truncatedCandidateCount: Math.max(0, pool.length - candidates.length),
      labeledCount: labeled.length,
      topicCount: new Set(labeled.flatMap((question) => question.topics.map(({ topicId }) => topicId))).size,
      difficultyCounts: Object.fromEntries(['EASY', 'MEDIUM', 'HARD'].map((difficulty) =>
        [difficulty, candidates.filter((question) => question.difficulty === difficulty).length])),
    }
    if (candidates.length) banks.push({ candidates, labeled, report })
  }
  if (!banks.length) throw new Error('No eligible subject bank found')
  for (const bank of banks) console.log(JSON.stringify({ bank: bank.report }))
  const { candidates, labeled, report } = banks.sort((left, right) =>
    right.labeled.length - left.labeled.length || right.candidates.length - left.candidates.length)[0]
  const count = Math.min(10, candidates.length)
  const topicTargets = defaultTopicTargets(candidates, count)
    const started = Date.now()
    try {
      const proposal = await requestExamDraftAgent({
        message: 'Chọn đề cân bằng các chủ đề và độ khó từ câu hỏi có sẵn.',
        desiredCount: count, format: 'OBJECTIVE',
        topicTargets: Object.fromEntries(topicTargets.map(({ topicId, count: targetCount }) => {
          const topic = candidates.flatMap((question) => question.topics).find((entry) => entry.topicId === topicId)!.topic
          return [topic.code, targetCount]
        })),
        candidates: candidates.map((question) => ({ id: question.id, title: decryptField(question.title).slice(0, 180),
          content: decryptField(question.content).slice(0, 300), difficulty: question.difficulty, type: question.type,
          topics: question.topics.map(({ topic }) => topic.code) })),
      })
      const selected = validateExamDraftSelection(proposal.questionIds, candidates,
        { desiredCount: count, format: 'OBJECTIVE', topicTargets })
      report.examSelection = {
        valid: true, selectedCount: selected.length, latencyMs: Date.now() - started,
        labeledCount: selected.filter((question) => question.topics.length > 0).length,
        coveredTopicCount: new Set(selected.flatMap((question) => question.topics.map(({ topicId }) => topicId))).size,
      }
    } catch (error) {
      report.examSelection = { valid: false, errorType: error instanceof Error ? error.name : 'Unknown' }
    }
    let matched = 0
    let attempted = 0
    for (const question of (process.argv.includes('--exam-only') ? [] : labeled.slice(0, 5))) {
      try {
        const response = await requestTopicSuggestionAgent({ title: decryptField(question.title).slice(0, 300),
          content: decryptField(question.content).slice(0, 3000),
          existingTopics: [...new Map(candidates.flatMap((candidate) => candidate.topics.map(({ topic }) =>
            [topic.code, { code: topic.code, name: topic.name }] as const))).values()],
        })
        attempted += 1
        const expected = new Set(question.topics.map(({ topic }) => topic.code.toUpperCase()))
        if (response.existingCodes.some((code) => expected.has(code.toUpperCase()))) matched += 1
      } catch { break }
    }
    report.topicSuggestion = { attempted, matched, hitRate: attempted ? matched / attempted : null }
  console.log(JSON.stringify({ agentEvaluation: report }))
  if ((report.examSelection as { valid: boolean }).valid === false) process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({ evaluationFailed: true, errorType: error instanceof Error ? error.name : 'Unknown' }))
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
