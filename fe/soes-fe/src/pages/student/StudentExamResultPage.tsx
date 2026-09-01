import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  XCircle,
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useGetExamAttemptResult, useGetExamAttemptStatus } from './hooks/take-exam/useTakeExamApi'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import ExamScorePanel from './components/exam-result/ExamScorePanel'
import {
  getAttemptEndedByLabel,
  getAttemptStatusLabel,
  isCompletedAttemptStatus,
} from './utils/attemptStatus'

export default function StudentExamResultPage() {
  const { courseOfferingId, scheduleId } = useParams<{
    courseOfferingId: string
    scheduleId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const attemptId: string | undefined = location.state?.attemptId

  const { data: status, isLoading, error } = useGetExamAttemptStatus(
    scheduleId ?? '',
    attemptId ?? '',
    !!scheduleId && !!attemptId,
  )
  const { data: result } = useGetExamAttemptResult(
    scheduleId ?? '',
    attemptId ?? '',
    !!scheduleId && !!attemptId,
  )

  function handleBack() {
    if (courseOfferingId) {
      navigate(`/student/course-offerings/${courseOfferingId}`, {
        state: { activeTab: 'timeline' },
      })
    } else {
      navigate('/student')
    }
  }

  const isCompleted = status ? isCompletedAttemptStatus(status.status) : false
  const isSubmitted = status?.status === 'SUBMITTED'
  const isExpired = status?.status === 'EXPIRED' || status?.status === 'AUTO_SUBMITTED'
  const isGraded = status?.status === 'GRADED' || status?.status === 'PUBLISHED'
  const isGrading = status?.status === 'GRADING'

  function formatDateTime(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function formatDuration(startedAt: string | null | undefined, submittedAt: string | null | undefined) {
    if (!startedAt || !submittedAt) return '—'
    const diffMs = new Date(submittedAt).getTime() - new Date(startedAt).getTime()
    if (isNaN(diffMs) || diffMs < 0) return '—'
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes} phút ${seconds} giây`
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại chi tiết bài thi</span>
          </button>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Đang tải kết quả bài thi...
            </div>
          )}

          {/* Error / No attemptId */}
          {(error || (!isLoading && !attemptId)) && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <XCircle size={40} className="text-rose-400" />
              <p className="text-sm text-gray-500">Không tìm thấy kết quả bài thi.</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Quay lại
              </button>
            </div>
          )}

          {/* Result Content */}
          {status && (
            <>
              {result && <ExamScorePanel result={result} />}
              {/* Banner Header */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Kết quả bài thi
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Mã attempt: <span className="font-mono text-gray-700">{status.attemptId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isGraded && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      {getAttemptStatusLabel(status.status)}
                    </span>
                  )}
                  {!isGraded && isGrading && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {getAttemptStatusLabel(status.status)}
                    </span>
                  )}
                  {!isGraded && !isGrading && isSubmitted && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Đã nộp bài
                    </span>
                  )}
                  {!isGraded && !isGrading && isExpired && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                      <Clock size={13} />
                      {getAttemptStatusLabel(status.status)}
                    </span>
                  )}
                  {!isGraded && !isGrading && !isSubmitted && !isExpired && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {getAttemptStatusLabel(status.status)}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</span>
                  <p className="text-lg font-bold text-gray-900">
                    {getAttemptStatusLabel(status.status)}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {status.endedBy ? `Kết thúc bởi: ${getAttemptEndedByLabel(status.endedBy)}` : '—'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Số câu đã làm</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{status.answeredCount}</span>
                    <span className="text-xs text-gray-400">/ {status.totalQuestionCount} câu</span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {status.totalQuestionCount > 0
                      ? `${Math.round((status.answeredCount / status.totalQuestionCount) * 100)}% hoàn thành`
                      : '—'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời điểm nộp bài</span>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {formatDateTime(status.submittedAt)}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={13} /> Thời gian làm bài
                  </span>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {formatDuration(status.startedAt, status.submittedAt)}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    Bắt đầu: {formatDateTime(status.startedAt)}
                  </span>
                </div>
              </div>

              {/* Detail section */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FileCheck size={16} className="text-blue-600" />
                  Thông tin chi tiết lần làm bài
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Mã attempt</span>
                      <span className="font-mono font-semibold">{status.attemptId}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Trạng thái</span>
                      <span className="font-semibold">{getAttemptStatusLabel(status.status)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Kết thúc bởi</span>
                      <span className="font-semibold">{getAttemptEndedByLabel(status.endedBy)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Thời gian bắt đầu</span>
                      <span className="font-semibold">{formatDateTime(status.startedAt)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Deadline attempt</span>
                      <span className="font-semibold">{formatDateTime(status.deadlineAt)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-2">
                      <span className="text-gray-500">Thời điểm nộp</span>
                      <span className="font-semibold">{formatDateTime(status.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                {!isCompleted && !isExpired && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Bài thi chưa được nộp hoàn chỉnh. Kết quả điểm số sẽ được công bố sau khi giáo viên chấm bài.
                  </div>
                )}

                {result?.available && result.reviewPolicy === 'NONE' && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                    Ca thi chỉ công bố điểm, không cho phép xem lại bài làm.
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
