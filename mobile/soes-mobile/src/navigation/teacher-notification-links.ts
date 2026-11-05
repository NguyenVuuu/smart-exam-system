import type { Href } from 'expo-router'

export function resolveTeacherNotificationLink(link: string | null): Href | null {
  if (!link) return null
  if (link === '/teacher/department-approvals') return '/(app)/(teacher)/approvals'
  if (link === '/teacher/question-approvals') return '/(app)/(teacher)/question-approvals'
  const exam = /^\/teacher\/exams\/([a-zA-Z0-9-]+)$/.exec(link)
  if (exam) return { pathname: '/(app)/(teacher)/exams/[examId]', params: { examId: exam[1] } }
  if (link === '/teacher/exams') return '/(app)/(teacher)/exams'
  if (link === '/teacher/questions') return '/(app)/(teacher)/question-bank'
  return null
}
