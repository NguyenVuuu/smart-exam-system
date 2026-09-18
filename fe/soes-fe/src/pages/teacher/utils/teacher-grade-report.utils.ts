import type { StudentGradeRow } from '../components/grade-export/GradeExportTable'
import type { Exam, ExamSchedule } from '../types/teacher-exam.types'
import type { TeacherExamSubmissionDto } from '../types/teacher-exam-api.types'

const SCORE_BUCKETS = [
  { range: '0 - 1', min: 0, max: 1 },
  { range: '1 - 2', min: 1, max: 2 },
  { range: '2 - 3', min: 2, max: 3 },
  { range: '3 - 4', min: 3, max: 4 },
  { range: '4 - 5', min: 4, max: 5 },
  { range: '5 - 6', min: 5, max: 6 },
  { range: '6 - 7', min: 6, max: 7 },
  { range: '7 - 8', min: 7, max: 8 },
  { range: '8 - 9', min: 8, max: 9 },
  { range: '9 - 10', min: 9, max: 10.1 },
]

export interface GradeStatistics {
  totalSubmissions: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passCount: number
  passRate: string
}

function letterGrade(score: number): StudentGradeRow['letterGrade'] {
  if (score >= 8.5) return 'A'
  if (score >= 7) return 'B'
  if (score >= 5.5) return 'C'
  if (score >= 4) return 'D'
  return 'F'
}

function scoreOnTenPointScale(score: number, totalPoints?: number) {
  if (!totalPoints || totalPoints === 10) return score
  return (score / totalPoints) * 10
}

export function buildGradeRows(
  submissions: TeacherExamSubmissionDto[],
  exam?: Exam,
  schedule?: ExamSchedule,
): StudentGradeRow[] {
  return submissions.map((submission) => {
    const score = submission.finalScore ?? submission.manualScoreOverride ?? submission.autoScore ?? 0
    const totalScore = scoreOnTenPointScale(score, exam?.totalPoints)
    return {
      id: submission.id,
      studentCode: submission.studentCode,
      studentName: submission.studentName,
      classCode: schedule?.courseCode || 'N/A',
      submittedAt: submission.submittedAt,
      totalScore,
      letterGrade: letterGrade(totalScore),
      status: submission.status,
    }
  })
}

export function filterGradeRows(rows: StudentGradeRow[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi')
  if (!normalizedKeyword) return rows
  return rows.filter((row) =>
    `${row.studentCode} ${row.studentName}`.toLocaleLowerCase('vi').includes(normalizedKeyword),
  )
}

export function gradeStatistics(rows: StudentGradeRow[]): GradeStatistics {
  if (rows.length === 0) {
    return { totalSubmissions: 0, averageScore: 0, highestScore: 0, lowestScore: 0, passCount: 0, passRate: '0' }
  }
  const scores = rows.map((row) => row.totalScore)
  const passCount = scores.filter((score) => score >= 4).length
  return {
    totalSubmissions: rows.length,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / rows.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passCount,
    passRate: ((passCount / rows.length) * 100).toFixed(1),
  }
}

export function gradeDistribution(rows: StudentGradeRow[]) {
  return SCORE_BUCKETS.map((bucket) => ({
    range: bucket.range,
    count: rows.filter((row) => row.totalScore >= bucket.min && row.totalScore < bucket.max).length,
  }))
}

function csvCell(content: string | number) {
  return `"${String(content).replaceAll('"', '""')}"`
}

export function exportGradeCsv(rows: StudentGradeRow[], examTitle: string) {
  const headers = ['MSSV', 'Họ và tên', 'Mã lớp HP', 'Thời gian nộp', 'Điểm hệ 10', 'Điểm chữ', 'Trạng thái']
  const records = rows.map((row) => [
    row.studentCode, row.studentName, row.classCode, row.submittedAt ?? '',
    row.totalScore.toFixed(2), row.letterGrade, row.status,
  ].map(csvCell).join(','))
  const blob = new Blob([`\uFEFF${[headers.map(csvCell).join(','), ...records].join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bang-diem-${examTitle || 'export'}-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
