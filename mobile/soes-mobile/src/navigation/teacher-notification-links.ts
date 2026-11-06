import type { Href } from 'expo-router'

export function resolveTeacherNotificationLink(link: string | null, title?: string): Href | null {
  if (!link && title?.toLocaleLowerCase('vi').includes('phúc khảo')) return '/(app)/(teacher)/appeals'
  if (!link) return null
  if (link === '/teacher/department-approvals') return '/(app)/(teacher)/approvals'
  if (link === '/teacher/question-approvals') return '/(app)/(teacher)/approvals?tab=questions'
  if (link?.startsWith('/teacher/grading-reports')) return '/(app)/(teacher)/appeals'
  const exam = /^\/teacher\/exams\/([a-zA-Z0-9-]+)$/.exec(link)
  if (exam) return { pathname: '/(app)/(teacher)/exams/[examId]', params: { examId: exam[1] } }
  if (link === '/teacher/exams') return '/(app)/(teacher)/exams'
  if (link === '/teacher/questions') return '/(app)/(teacher)/question-bank'
  return null
}
