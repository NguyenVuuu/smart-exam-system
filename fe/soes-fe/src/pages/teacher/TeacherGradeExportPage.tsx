import { Bell, FileSpreadsheet, MessageSquareWarning, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../api/socket'
import AppSelect from '../../components/common/AppSelect'
import { formatSessionRange } from '../../utils/date.utils'
import {
  getTeacherExam,
  getTeacherGradeAppeals,
  getTeacherExamSchedules,
  getTeacherExamSubmissions,
  getTeacherExams,
  gradeTeacherExamSubmission,
  updateTeacherGradeAppeal,
  type TeacherGradeAppeal,
} from './api/teacher-exams.api'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import GradeStatisticsCards from './components/grade-export/GradeStatisticsCards'
import GradeDistributionChart from './components/grade-export/GradeDistributionChart'
import GradeExportTable, { type StudentGradeRow } from './components/grade-export/GradeExportTable'
import SubmissionAnswerList from './components/exam-detail/SubmissionAnswerList'
import { toExam, toExamDetail, toExamSchedule } from './mappers/teacher-exam.mapper'
import type { TeacherExamSubmissionDto } from './types/teacher-exam-api.types'
import type { Exam, ExamSchedule, ExamSubmission } from './types/teacher-exam.types'

type GradeReportTab = 'reports' | 'appeals' | 'notifications'

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

const gradeAppealLabel = (status: TeacherGradeAppeal['status']) => {
  switch (status) {
    case 'PENDING': return 'Chờ xử lý'
    case 'IN_REVIEW': return 'Đang xem'
    case 'RESOLVED': return 'Đã xử lý'
    case 'REJECTED': return 'Từ chối'
    default: return status
  }
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

const toExamSubmission = (dto: TeacherExamSubmissionDto): ExamSubmission => ({
  ...dto,
  submittedAt: dto.submittedAt ?? '',
  answers: dto.answers.map((answer) => ({
    ...answer,
    sourceCode: answer.sourceCode ?? undefined,
  })),
  codingResults: dto.codingResults.map((result) => ({
    ...result,
    actualOutput: result.actualOutput ?? '',
  })),
})

export default function TeacherGradeExportPage() {
  const [activeTab, setActiveTab] = useState<GradeReportTab>('reports')
  const [exams, setExams] = useState<Exam[]>([])
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [submissions, setSubmissions] = useState<TeacherExamSubmissionDto[]>([])
  const [loadedSubmissionKey, setLoadedSubmissionKey] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [appeals, setAppeals] = useState<TeacherGradeAppeal[]>([])
  const [appealReply, setAppealReply] = useState<Record<string, string>>({})
  const [realtimeNotifications, setRealtimeNotifications] = useState<TeacherGradeAppeal[]>([])
  const [selectedAppeal, setSelectedAppeal] = useState<TeacherGradeAppeal | null>(null)
  const [selectedAppealExam, setSelectedAppealExam] = useState<Exam | null>(null)
  const [selectedAppealSubmission, setSelectedAppealSubmission] = useState<ExamSubmission | null>(null)
  const [appealScoreInput, setAppealScoreInput] = useState(0)
  const [appealScoreReason, setAppealScoreReason] = useState('')
  const [isLoadingAppealSubmission, setIsLoadingAppealSubmission] = useState(false)
  const [isSavingAppealScore, setIsSavingAppealScore] = useState(false)
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
    getTeacherGradeAppeals({ status: 'ALL', pageSize: 50 })
      .then((data) => setAppeals(data.items))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    const handleGradeAppealCreated = (appeal: TeacherGradeAppeal) => {
      setAppeals((current) => current.some((item) => item.id === appeal.id) ? current : [appeal, ...current])
      setRealtimeNotifications((current) => [appeal, ...current].slice(0, 50))
      setActiveTab('notifications')
      toast.info('Có yêu cầu phúc khảo mới', {
        description: `${appeal.student.fullName} vừa gửi phúc khảo cho ${appeal.exam.title}.`,
      })
    }

    socket.on('grade_appeal:created', handleGradeAppealCreated)
    return () => {
      socket.off('grade_appeal:created', handleGradeAppealCreated)
    }
  }, [])

  useEffect(() => {
    if (!selectedExamId) return

    let active = true
    void getTeacherExamSchedules(selectedExamId).then((res) => {
      if (!active) return
      const mapped = res.map(toExamSchedule)
      setSchedules(mapped)
      setSelectedScheduleId(mapped[0]?.id ?? '')
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

  const handleUpdateAppeal = async (appealId: string, status: 'IN_REVIEW' | 'REJECTED') => {
    try {
      const updated = await updateTeacherGradeAppeal(appealId, {
        status,
        teacherReply: appealReply[appealId] || undefined,
      })
      setAppeals((current) => current.map((appeal) => appeal.id === appealId ? updated : appeal))
      toast.success('Đã cập nhật phúc khảo.')
    } catch {
      toast.error('Không thể cập nhật phúc khảo.')
    }
  }

  const openAppealExam = async (appeal: TeacherGradeAppeal) => {
    setActiveTab('appeals')
    setSelectedAppeal(appeal)
    setIsLoadingAppealSubmission(true)
    try {
      const [examDetail, submissionPage] = await Promise.all([
        getTeacherExam(appeal.exam.examId),
        getTeacherExamSubmissions(appeal.exam.examId, appeal.exam.scheduleId, 1, 100),
      ])
      const submission = submissionPage.items.find((item) => item.attemptId === appeal.attemptId)
      if (!submission) {
        toast.error('Không tìm thấy bài nộp tương ứng với yêu cầu phúc khảo.')
        return
      }
      const mappedSubmission = toExamSubmission(submission)
      setSelectedAppealExam(toExamDetail(examDetail))
      setSelectedAppealSubmission(mappedSubmission)
      setAppealScoreInput(mappedSubmission.manualScoreOverride ?? mappedSubmission.finalScore ?? mappedSubmission.autoScore ?? 0)
      setAppealScoreReason(mappedSubmission.overrideReason ?? appeal.teacherReply ?? appeal.reason)
    } catch {
      toast.error('Không thể tải bài nộp để chấm lại.')
    } finally {
      setIsLoadingAppealSubmission(false)
    }
  }

  const handleSaveAppealScore = async () => {
    if (!selectedAppeal || !selectedAppealSubmission) return
    if (selectedAppeal.status !== 'PENDING' && selectedAppeal.status !== 'IN_REVIEW') {
      toast.warning('Yêu cầu phúc khảo này đã hoàn tất, không thể chấm lại lần nữa.')
      return
    }
    if (appealScoreInput < 0 || appealScoreInput > selectedAppeal.exam.maxScore || appealScoreReason.trim().length < 5) {
      toast.warning('Vui lòng nhập điểm hợp lệ và lý do điều chỉnh rõ hơn.')
      return
    }
    setIsSavingAppealScore(true)
    try {
      await gradeTeacherExamSubmission(
        selectedAppeal.exam.examId,
        selectedAppeal.exam.scheduleId,
        selectedAppeal.attemptId,
        appealScoreInput,
        appealScoreReason.trim(),
      )
      setSelectedAppealSubmission((current) => current ? {
        ...current,
        manualScoreOverride: appealScoreInput,
        finalScore: appealScoreInput,
        overrideReason: appealScoreReason.trim(),
        status: current.status === 'PUBLISHED' ? 'PUBLISHED' : 'GRADED',
      } : current)
      setAppeals((current) => current.map((appeal) =>
        appeal.id === selectedAppeal.id
          ? {
              ...appeal,
              status: 'RESOLVED',
              teacherReply: appealScoreReason.trim(),
              handledAt: new Date().toISOString(),
              exam: { ...appeal.exam, score: appealScoreInput },
            }
          : appeal,
      ))
      setSelectedAppeal((current) => current ? {
        ...current,
        status: 'RESOLVED',
        teacherReply: appealScoreReason.trim(),
        handledAt: new Date().toISOString(),
        exam: { ...current.exam, score: appealScoreInput },
      } : current)
      toast.success('Đã lưu điểm phúc khảo cho bài nộp.')
    } catch {
      toast.error('Không thể lưu điểm phúc khảo.')
    } finally {
      setIsSavingAppealScore(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Báo cáo & Xuất điểm"
            description="Xem thống kê phổ điểm, quản lý phúc khảo và nhận thông báo mới theo thời gian thực."
            icon={<FileSpreadsheet size={20} />}
            actions={
              <button
                onClick={handleExportCSV}
                disabled={activeTab !== 'reports' || filteredRows.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet size={16} /> Xuất file CSV / Excel
              </button>
            }
          />

          <div className="flex flex-wrap gap-2 border-b border-slate-200">
            <TeacherGradeTabButton active={activeTab === 'reports'} icon={<FileSpreadsheet size={16} />} label="Báo cáo điểm" onClick={() => setActiveTab('reports')} />
            <TeacherGradeTabButton active={activeTab === 'appeals'} icon={<MessageSquareWarning size={16} />} label={`Phúc khảo (${appeals.length})`} onClick={() => setActiveTab('appeals')} />
            <TeacherGradeTabButton active={activeTab === 'notifications'} icon={<Bell size={16} />} label={`Thông báo realtime (${realtimeNotifications.length})`} onClick={() => setActiveTab('notifications')} />
          </div>

          {activeTab === 'reports' && (
            <>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Chọn đề thi</label>
                  <AppSelect value={selectedExamId} options={exams.map((e) => ({ value: e.id, label: e.title }))} onChange={selectExam} placeholder="Chọn đề thi..." />
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

              <GradeStatisticsCards totalSubmissions={totalSubmissions} avgScore={avgScore} maxScore={maxScore} minScore={minScore} passCount={passCount} passRate={passRate} />
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
            </>
          )}

          {activeTab === 'appeals' && (
            <AppealsPanel
              appeals={appeals}
              appealReply={appealReply}
              onOpenAppealExam={openAppealExam}
              selectedAppeal={selectedAppeal}
              selectedAppealExam={selectedAppealExam}
              selectedAppealSubmission={selectedAppealSubmission}
              appealScoreInput={appealScoreInput}
              appealScoreReason={appealScoreReason}
              isLoadingAppealSubmission={isLoadingAppealSubmission}
              isSavingAppealScore={isSavingAppealScore}
              onScoreChange={setAppealScoreInput}
              onReasonChange={setAppealScoreReason}
              onCloseRegradePanel={() => {
                setSelectedAppeal(null)
                setSelectedAppealExam(null)
                setSelectedAppealSubmission(null)
              }}
              onSaveAppealScore={handleSaveAppealScore}
              onReplyChange={(appealId, value) => setAppealReply((current) => ({ ...current, [appealId]: value }))}
              onUpdateAppeal={handleUpdateAppeal}
            />
          )}

          {activeTab === 'notifications' && (
            <RealtimeNotificationsPanel
              notifications={realtimeNotifications}
              onOpenAppealExam={openAppealExam}
              onViewAppeals={() => setActiveTab('appeals')}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function TeacherGradeTabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function AppealsPanel({
  appeals,
  appealReply,
  onOpenAppealExam,
  selectedAppeal,
  selectedAppealExam,
  selectedAppealSubmission,
  appealScoreInput,
  appealScoreReason,
  isLoadingAppealSubmission,
  isSavingAppealScore,
  onScoreChange,
  onReasonChange,
  onCloseRegradePanel,
  onSaveAppealScore,
  onReplyChange,
  onUpdateAppeal,
}: {
  appeals: TeacherGradeAppeal[]
  appealReply: Record<string, string>
  onOpenAppealExam: (appeal: TeacherGradeAppeal) => void
  selectedAppeal: TeacherGradeAppeal | null
  selectedAppealExam: Exam | null
  selectedAppealSubmission: ExamSubmission | null
  appealScoreInput: number
  appealScoreReason: string
  isLoadingAppealSubmission: boolean
  isSavingAppealScore: boolean
  onScoreChange: (score: number) => void
  onReasonChange: (reason: string) => void
  onCloseRegradePanel: () => void
  onSaveAppealScore: () => void
  onReplyChange: (appealId: string, value: string) => void
  onUpdateAppeal: (appealId: string, status: 'IN_REVIEW' | 'REJECTED') => void
}) {
  return (
    <div className="space-y-5">
    <TeacherTablePanel>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-950">Yêu cầu phúc khảo</h3>
        <p className="mt-1 text-xs text-slate-500">Xem lý do của sinh viên, mở bài thi để chấm lại và phản hồi trạng thái xử lý.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {appeals.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Chưa có yêu cầu phúc khảo.</div>
        ) : appeals.map((appeal) => (
          <div key={appeal.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{appeal.student.fullName}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{appeal.student.studentCode}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{gradeAppealLabel(appeal.status)}</span>
              </div>
              <p className="text-xs text-slate-500">{appeal.exam.title} - {appeal.exam.scheduleTitle}</p>
              <p className="text-sm leading-6 text-slate-700">{appeal.reason}</p>
              {appeal.teacherReply && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Phản hồi hiện tại: {appeal.teacherReply}</p>}
              {(appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW') ? (
                <button type="button" onClick={() => onOpenAppealExam(appeal)} className="rounded-lg border border-blue-200 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-50">
                  Mở bài thi để chấm lại
                </button>
              ) : (
                <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500">
                  Đã hoàn tất phúc khảo
                </span>
              )}
            </div>
            <div className="space-y-2">
              <textarea
                value={appealReply[appeal.id] ?? ''}
                onChange={(event) => onReplyChange(appeal.id, event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập phản hồi cho sinh viên..."
              />
              <div className="flex flex-wrap gap-2">
                {(appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW') && (
                  <>
                    <button type="button" onClick={() => onUpdateAppeal(appeal.id, 'IN_REVIEW')} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Đang xem</button>
                    <button type="button" onClick={() => onUpdateAppeal(appeal.id, 'REJECTED')} className="rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-rose-700">Từ chối</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TeacherTablePanel>
      {selectedAppeal && (
        <AppealRegradePanel
          appeal={selectedAppeal}
          exam={selectedAppealExam}
          submission={selectedAppealSubmission}
          scoreInput={appealScoreInput}
          reason={appealScoreReason}
          loading={isLoadingAppealSubmission}
          saving={isSavingAppealScore}
          onScoreChange={onScoreChange}
          onReasonChange={onReasonChange}
          onClose={onCloseRegradePanel}
          onSave={onSaveAppealScore}
        />
      )}
    </div>
  )
}

function AppealRegradePanel({
  appeal,
  exam,
  submission,
  scoreInput,
  reason,
  loading,
  saving,
  onScoreChange,
  onReasonChange,
  onClose,
  onSave,
}: {
  appeal: TeacherGradeAppeal
  exam: Exam | null
  submission: ExamSubmission | null
  scoreInput: number
  reason: string
  loading: boolean
  saving: boolean
  onScoreChange: (score: number) => void
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSave: () => void
}) {
  const canEdit = appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW'

  return (
    <TeacherTablePanel>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Chấm lại bài phúc khảo</h3>
          <p className="mt-1 text-xs text-slate-500">
            {appeal.student.fullName} - {appeal.student.studentCode} - {appeal.exam.title}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={16} />
        </button>
      </div>

      {loading && <div className="px-5 py-8 text-center text-sm text-slate-400">Đang tải bài nộp...</div>}

      {!loading && (!exam || !submission) && (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Chưa có dữ liệu bài nộp để chấm lại.</div>
      )}

      {!loading && exam && submission && (
        <div className="grid min-h-[560px] gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-0 border-r border-slate-100">
            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 text-xs md:grid-cols-4">
              <AppealScoreStat label="Điểm trước phúc khảo" value={submission.autoScore === null ? '-' : `${submission.autoScore}đ`} />
              <AppealScoreStat label="Điểm sau phúc khảo" value={submission.manualScoreOverride != null ? `${submission.manualScoreOverride}đ` : '-'} />
              <AppealScoreStat label="Điểm chốt" value={submission.finalScore === null ? '-' : `${submission.finalScore}đ`} />
              <AppealScoreStat label="Tối đa" value={`${appeal.exam.maxScore}đ`} />
            </div>
            <SubmissionAnswerList exam={exam} submission={submission} />
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
              <span className="font-bold">Lý do sinh viên:</span> {appeal.reason}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Điểm phúc khảo</label>
              <input
                type="number"
                min="0"
                max={appeal.exam.maxScore}
                step="0.1"
                value={scoreInput}
                onChange={(event) => onScoreChange(Number(event.target.value))}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-blue-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Lý do điều chỉnh / phản hồi</label>
              <textarea
                rows={5}
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập kết luận chấm lại để lưu cùng điểm phúc khảo..."
              />
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu điểm phúc khảo'}
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                Yêu cầu đã hoàn tất, không thể chấm lại lần nữa.
              </div>
            )}
          </div>
        </div>
      )}
    </TeacherTablePanel>
  )
}

function AppealScoreStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  )
}

function RealtimeNotificationsPanel({
  notifications,
  onOpenAppealExam,
  onViewAppeals,
}: {
  notifications: TeacherGradeAppeal[]
  onOpenAppealExam: (appeal: TeacherGradeAppeal) => void
  onViewAppeals: () => void
}) {
  return (
    <TeacherTablePanel>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-950">Thông báo realtime</h3>
        <p className="mt-1 text-xs text-slate-500">Các yêu cầu phúc khảo mới gửi tới giảng viên quản lý lớp trong phiên làm việc hiện tại.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Chưa có thông báo realtime trong phiên này.</div>
        ) : notifications.map((appeal) => (
          <div key={`${appeal.id}-notification`} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{appeal.student.fullName}</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Phúc khảo mới</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{appeal.exam.title} - {appeal.exam.scheduleTitle}</p>
              <p className="mt-2 text-sm text-slate-700">{appeal.reason}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={onViewAppeals} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                Xem danh sách
              </button>
              <button type="button" onClick={() => onOpenAppealExam(appeal)} className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-700">
                Mở bài thi
              </button>
            </div>
          </div>
        ))}
      </div>
    </TeacherTablePanel>
  )
}
