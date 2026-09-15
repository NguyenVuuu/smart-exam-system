import { FileSpreadsheet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppSelect from '../../components/common/AppSelect'
import { formatSessionRange } from '../../utils/date.utils'
import {
  getTeacherExamSchedules,
  getTeacherExamSubmissions,
  getTeacherExams,
} from './api/teacher-exams.api'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import GradeStatisticsCards from './components/grade-export/GradeStatisticsCards'
import GradeDistributionChart from './components/grade-export/GradeDistributionChart'
import GradeExportTable, { type StudentGradeRow } from './components/grade-export/GradeExportTable'
import { toExam, toExamSchedule } from './mappers/teacher-exam.mapper'
import type { TeacherExamSubmissionDto } from './types/teacher-exam-api.types'
import type { Exam, ExamSchedule } from './types/teacher-exam.types'

const SCORE_BUCKETS = [
  { label: '0 - 1', min: 0, max: 1 },
  { label: '1 - 2', min: 1, max: 2 },
  { label: '2 - 3', min: 2, max: 3 },
  { label: '3 - 4', min: 3, max: 4 },
  { label: '4 - 5', min: 4, max: 5 },
  { label: '5 - 6', min: 5, max: 6 },
  { label: '6 - 7', min: 6, max: 7 },
  { label: '7 - 8', min: 7, max: 8 },
  { label: '8 - 9', min: 8, max: 9 },
  { label: '9 - 10', min: 9, max: 10.1 },
]

const getLetterGrade = (score: number): StudentGradeRow['letterGrade'] => {
  if (score >= 8.5) return 'A'
  if (score >= 7) return 'B'
  if (score >= 5.5) return 'C'
  if (score >= 4) return 'D'
  return 'F'
}

const normalizeScore = (score: number, totalPoints?: number) => {
  if (!totalPoints || totalPoints === 10) return score
  return (score / totalPoints) * 10
}

const SUBMISSION_REPORT_PAGE_SIZE = 100

const getAllTeacherExamSubmissions = async (examId: string, scheduleId: string) => {
  const firstPage = await getTeacherExamSubmissions(examId, scheduleId, 1, SUBMISSION_REPORT_PAGE_SIZE)
  const items: TeacherExamSubmissionDto[] = [...firstPage.items]
  if (firstPage.pagination.totalPages <= 1) return items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      getTeacherExamSubmissions(examId, scheduleId, index + 2, SUBMISSION_REPORT_PAGE_SIZE),
    ),
  )
  remainingPages.forEach((page) => items.push(...page.items))
  return items
}

export default function TeacherGradeExportPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [submissions, setSubmissions] = useState<TeacherExamSubmissionDto[]>([])
  const [loadedSubmissionKey, setLoadedSubmissionKey] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const submissionKey = `${selectedExamId}:${selectedScheduleId}`
  const loading = Boolean(selectedExamId && selectedScheduleId) && loadedSubmissionKey !== submissionKey

  useEffect(() => {
    getTeacherExams().then((res) => {
      const mapped = res.map(toExam)
      setExams(mapped)
      if (mapped.length > 0) setSelectedExamId(mapped[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedExamId) return

    let active = true
    void getTeacherExamSchedules(selectedExamId).then((res) => {
      if (!active) return
      const mapped = res.map(toExamSchedule)
      setSchedules(mapped)
      if (mapped.length > 0) setSelectedScheduleId(mapped[0].id)
      else setSelectedScheduleId('')
    })

    return () => {
      active = false
    }
  }, [selectedExamId])

  useEffect(() => {
    if (!selectedExamId || !selectedScheduleId) return

    let active = true
    void getAllTeacherExamSubmissions(selectedExamId, selectedScheduleId)
      .then((allSubmissions) => {
        if (active) setSubmissions(allSubmissions)
      })
      .catch(() => {
        if (active) toast.error('Không thể tải dữ liệu điểm của ca thi.')
      })
      .finally(() => {
        if (active) setLoadedSubmissionKey(submissionKey)
      })

    return () => {
      active = false
    }
  }, [selectedExamId, selectedScheduleId, submissionKey])

  const selectExam = (examId: string) => {
    setSelectedExamId(examId)
    setSchedules([])
    setSelectedScheduleId('')
    setSubmissions([])
  }

  const selectSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId)
    setSubmissions([])
  }

  const selectedExam = useMemo(() => exams.find((e) => e.id === selectedExamId), [exams, selectedExamId])
  const selectedSchedule = useMemo(() => schedules.find((s) => s.id === selectedScheduleId), [schedules, selectedScheduleId])

  const rows: StudentGradeRow[] = useMemo(() => {
    return submissions.map((sub) => {
      const rawScore = sub.finalScore ?? sub.manualScoreOverride ?? sub.autoScore ?? 0
      const scaledScore = normalizeScore(rawScore, selectedExam?.totalPoints)
      return {
        id: sub.id,
        studentCode: sub.studentCode,
        studentName: sub.studentName,
        classCode: selectedSchedule?.courseCode || 'N/A',
        submittedAt: sub.submittedAt,
        totalScore: scaledScore,
        letterGrade: getLetterGrade(scaledScore),
        status: sub.status,
      }
    })
  }, [submissions, selectedExam, selectedSchedule])

  const filteredRows = useMemo(() => {
    if (!searchKeyword) return rows
    const lower = searchKeyword.toLowerCase()
    return rows.filter(
      (r) => r.studentCode.toLowerCase().includes(lower) || r.studentName.toLowerCase().includes(lower),
    )
  }, [rows, searchKeyword])

  const totalSubmissions = rows.length
  const avgScore = totalSubmissions > 0 ? rows.reduce((acc, r) => acc + r.totalScore, 0) / totalSubmissions : 0
  const maxScore = totalSubmissions > 0 ? Math.max(...rows.map((r) => r.totalScore)) : 0
  const minScore = totalSubmissions > 0 ? Math.min(...rows.map((r) => r.totalScore)) : 0
  const passCount = rows.filter((r) => r.totalScore >= 4.0).length
  const passRate = totalSubmissions > 0 ? ((passCount / totalSubmissions) * 100).toFixed(1) : '0'

  const chartData = useMemo(() => {
    return SCORE_BUCKETS.map((b) => ({
      range: b.label,
      count: rows.filter((r) => r.totalScore >= b.min && r.totalScore < b.max).length,
    }))
  }, [rows])

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return
    const headers = ['MSSV', 'Họ và tên', 'Mã lớp HP', 'Thời gian nộp', 'Điểm số (Hệ 10)', 'Điểm chữ', 'Trạng thái']
    const csvRows = [headers.join(',')]
    filteredRows.forEach((r) => {
      csvRows.push([`"${r.studentCode}"`, `"${r.studentName}"`, `"${r.classCode}"`, `"${r.submittedAt}"`, r.totalScore.toFixed(2), r.letterGrade, `"${r.status}"`].join(','))
    })
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bang-diem-${selectedExam?.title || 'export'}-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Báo cáo & Xuất điểm"
            description="Xem thống kê phổ điểm bài thi và xuất bảng điểm chi tiết của sinh viên."
            icon={<FileSpreadsheet size={20} />}
            actions={
              <button
                onClick={handleExportCSV}
                disabled={filteredRows.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <FileSpreadsheet size={16} /> Xuất file CSV / Excel
              </button>
            }
          />

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Chọn đề thi</label>
              <AppSelect
                value={selectedExamId}
                options={exams.map((e) => ({ value: e.id, label: e.title }))}
                onChange={selectExam}
                placeholder="Chọn đề thi..."
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Chọn ca thi</label>
              <AppSelect
                value={selectedScheduleId}
                options={schedules.map((s) => ({
                  value: s.id,
                  label: `${s.courseCode || 'Ca thi'} (${formatSessionRange(s.startTime, s.endTime)})`,
                }))}
                onChange={selectSchedule}
                placeholder="Chọn ca thi..."
                disabled={schedules.length === 0}
              />
            </div>
          </div>

          <GradeStatisticsCards
            totalSubmissions={totalSubmissions}
            avgScore={avgScore}
            maxScore={maxScore}
            minScore={minScore}
            passCount={passCount}
            passRate={passRate}
          />

          <GradeDistributionChart chartData={chartData} />

          <TeacherTablePanel>
            <TeacherToolbar
              filters={<h3 className="text-sm font-semibold text-slate-950">Danh sách bảng điểm sinh viên</h3>}
              searchValue={searchKeyword}
              onSearchChange={setSearchKeyword}
              searchPlaceholder="Tìm kiếm theo MSSV hoặc họ tên..."
              onReset={() => setSearchKeyword('')}
            />
            <GradeExportTable rows={filteredRows} loading={loading} />
          </TeacherTablePanel>
        </main>
      </div>
    </div>
  )
}
