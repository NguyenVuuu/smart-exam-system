import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, ExternalLink, RefreshCw, RotateCcw, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../../../components/common/AppBadge'
import type { TeacherExamDto } from '../../types/teacher-exam-api.types'
import type { ExamSchedule, ExamSubmission } from '../../types/teacher-exam.types'
import { getTeacherExamsBySubject, getTeacherMakeupEligibility, type MakeupEligibility } from '../../api/teacher-exams.api'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

function formatTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Đã hết hạn'
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (hours > 0) return `còn ${hours} giờ ${minutes} phút`
  return `còn ${minutes} phút`
}

// ── Step indicator ──────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { label: 'Chọn đề thi', icon: <BookOpen size={14} /> },
    { label: 'Chọn sinh viên', icon: <Users size={14} /> },
    { label: 'Cấu hình ca', icon: <Clock size={14} /> },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <div key={num} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle2 size={13} /> : s.icon}
              {s.label}
            </div>
            {i < 2 && (
              <div className={`mx-1 h-px w-5 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────────

export interface MakeupScheduleModalProps {
  isOpen: boolean
  examId: string
  scheduleId: string
  sourceSchedule: ExamSchedule
  subjectId: string
  submissions: ExamSubmission[]
  availableExams: TeacherExamDto[]    // đề cùng môn, đã anchor — dùng là initialAvailableExams bên trong
  onClose: () => void
  onCreate: (input: {
    studentIds: string[]
    makeupExamId: string | null
    startTime: string
    endTime: string
    durationMinutes: number
    password: string | null
    enableTabLock: boolean
    requireFullscreen: boolean
    enableWebcam: boolean
    enableScreenMonitoring: boolean
    blockCopyPaste: boolean
    blockRightClick: boolean
  }) => Promise<void>
}

// ── Main ─────────────────────────────────────────────────────────────────────────

export default function MakeupScheduleModal({
  isOpen,
  examId,
  scheduleId,
  sourceSchedule,
  subjectId,
  submissions,
  availableExams: initialAvailableExams,
  onClose,
  onCreate,
}: MakeupScheduleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [eligibility, setEligibility] = useState<MakeupEligibility | null>(null)
  const [loadingEligibility, setLoadingEligibility] = useState(true)

  // Step 1 — exam
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null) // null = dùng đề gốc
  const [availableExams, setAvailableExams] = useState<TeacherExamDto[]>(initialAvailableExams)
  const [showNewExamGuide, setShowNewExamGuide] = useState(false)
  const [reloadingExams, setReloadingExams] = useState(false)

  // Step 2 — students
  const [studentIds, setStudentIds] = useState<string[]>(() =>
    submissions.filter((s) => !s.hasSubmitted).map((s) => s.studentId),
  )

  // Step 3 — config
  const sourceEndTime = new Date(sourceSchedule.endTime)
  const defaultStart = new Date(sourceEndTime.getTime() + 30 * 60_000)
  const defaultEnd = new Date(defaultStart.getTime() + (sourceSchedule.durationMinutes ?? 60) * 60_000)
  const [startTime, setStartTime] = useState(toLocalInputValue(defaultStart))
  const [endTime, setEndTime] = useState(toLocalInputValue(defaultEnd))
  const [durationMinutes, setDurationMinutes] = useState(sourceSchedule.durationMinutes ?? 60)
  const [password, setPassword] = useState('')
  const [enableTabLock, setEnableTabLock] = useState(sourceSchedule.enableTabLock ?? true)
  const [requireFullscreen, setRequireFullscreen] = useState(sourceSchedule.requireFullscreen ?? false)
  const [enableWebcam, setEnableWebcam] = useState(sourceSchedule.enableWebcam ?? false)
  const [enableScreenMonitoring, setEnableScreenMonitoring] = useState(sourceSchedule.enableScreenMonitoring ?? false)
  const [blockCopyPaste, setBlockCopyPaste] = useState(sourceSchedule.blockCopyPaste ?? true)
  const [blockRightClick, setBlockRightClick] = useState(sourceSchedule.blockRightClick ?? true)
  const [saving, setSaving] = useState(false)

  // Load eligibility khi mở modal
  useEffect(() => {
    if (!isOpen) return
    setLoadingEligibility(true)
    getTeacherMakeupEligibility(examId, scheduleId)
      .then(setEligibility)
      .catch(() => setEligibility(null))
      .finally(() => setLoadingEligibility(false))
  }, [isOpen, examId, scheduleId])

  // Sync availableExams khi prop thay đổi từ bên ngoài
  useEffect(() => {
    setAvailableExams(initialAvailableExams)
  }, [initialAvailableExams])

  const reloadExams = async () => {
    setReloadingExams(true)
    try {
      const items = await getTeacherExamsBySubject(subjectId)
      const filtered = items.filter(
        (e) => e.id !== examId && (e.status === 'READY' || e.status === 'LOCKED'),
      )
      setAvailableExams(filtered)
      if (filtered.length === 0) {
        toast.info('Chưa có đề mới nào sẵn sàng. Kiểm tra lại sau khi đề được anchor blockchain.')
      } else {
        toast.success(`Đã tải ${filtered.length} đề có thể dùng.`)
      }
    } catch {
      toast.error('Không thể tải danh sách đề thi.')
    } finally {
      setReloadingExams(false)
    }
  }

  if (!isOpen) return null

  const toggleStudent = (studentId: string) => {
    setStudentIds((cur) =>
      cur.includes(studentId) ? cur.filter((id) => id !== studentId) : [...cur, studentId],
    )
  }

  const selectAllAbsent = () => {
    setStudentIds(submissions.filter((s) => !s.hasSubmitted).map((s) => s.studentId))
  }

  const submit = async () => {
    if (!studentIds.length) { toast.warning('Chọn ít nhất một sinh viên.'); return }
    if (new Date(endTime) <= new Date(startTime)) { toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.'); return }
    if (new Date(startTime) <= sourceEndTime) { toast.error('Thời gian bắt đầu phải sau khi ca gốc kết thúc.'); return }
    setSaving(true)
    try {
      await onCreate({
        studentIds,
        makeupExamId: selectedExamId,
        startTime,
        endTime,
        durationMinutes,
        password: password.trim() || null,
        enableTabLock,
        requireFullscreen,
        enableWebcam,
        enableScreenMonitoring,
        blockCopyPaste,
        blockRightClick,
      })
    } catch {
      toast.error('Không thể tạo ca thi dự phòng.')
    } finally {
      setSaving(false)
    }
  }

  const selectedExam = availableExams.find((e) => e.id === selectedExamId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900">Tạo ca thi dự phòng</h3>
            <StepIndicator step={step} />
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">

          {/* Loading eligibility */}
          {loadingEligibility && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              Đang kiểm tra điều kiện...
            </div>
          )}

          {/* Không đủ điều kiện */}
          {!loadingEligibility && eligibility && !eligibility.eligible && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center space-y-3">
              <AlertTriangle size={28} className="mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-amber-900">
                {eligibility.reason === 'already_published' && 'Điểm ca thi đã được chốt'}
                {eligibility.reason === 'deadline_passed' && 'Đã quá 48 giờ kể từ khi ca thi kết thúc'}
                {eligibility.reason === 'makeup_exists' && 'Ca thi này đã có ca dự phòng'}
                {eligibility.reason === 'not_found' && 'Không tìm thấy ca thi'}
              </p>
              {eligibility.reason === 'already_published' && (
                <p className="text-xs text-amber-700">Điểm đã chốt không thể tạo ca dự phòng nữa.</p>
              )}
              {eligibility.reason === 'deadline_passed' && (
                <p className="text-xs text-amber-700">Hạn tạo ca dự phòng là 48 giờ sau khi ca gốc kết thúc.</p>
              )}
              {eligibility.reason === 'makeup_exists' && eligibility.existingMakeup && (
                <div className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-left text-xs space-y-1">
                  <p className="font-semibold text-gray-800">Ca dự phòng hiện tại:</p>
                  <p className="text-gray-600">{formatDateTime(eligibility.existingMakeup.startTime)} → {formatDateTime(eligibility.existingMakeup.endTime)}</p>
                  <AppBadge tone={eligibility.existingMakeup.status === 'CLOSED' ? 'gray' : 'blue'} className="text-xs">
                    {eligibility.existingMakeup.status}
                  </AppBadge>
                </div>
              )}
            </div>
          )}

          {/* Đủ điều kiện — Hiển thị steps */}
          {!loadingEligibility && eligibility?.eligible && (
            <>
              {/* Deadline banner */}
              {eligibility.deadline && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
                  <Clock size={13} className="shrink-0" />
                  <span>Hạn tạo ca dự phòng: <strong>{formatDateTime(eligibility.deadline)}</strong> ({formatTimeLeft(eligibility.deadline)})</span>
                </div>
              )}

              {/* ── STEP 1: Chọn đề thi ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Chọn đề thi sẽ dùng cho ca dự phòng. Có thể dùng lại đề gốc hoặc chọn đề khác cùng môn học.</p>

                  {/* Đề gốc */}
                  <button
                    type="button"
                    onClick={() => { setSelectedExamId(null); setShowNewExamGuide(false) }}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors ${
                      selectedExamId === null && !showNewExamGuide ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Dùng lại đề gốc</p>
                        <p className="mt-0.5 text-xs text-gray-500">Sinh viên làm cùng đề như ca trước</p>
                      </div>
                      {selectedExamId === null && !showNewExamGuide && <CheckCircle2 size={18} className="text-blue-500 shrink-0" />}
                    </div>
                  </button>

                  {/* Đề có sẵn */}
                  {availableExams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đề khác cùng môn học</p>
                      {availableExams.map((exam) => (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => { setSelectedExamId(exam.id); setShowNewExamGuide(false) }}
                          className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors ${
                            selectedExamId === exam.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{exam.title}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{exam.totalPoints} điểm · {exam.defaultDurationMinutes} phút</p>
                            </div>
                            {selectedExamId === exam.id && <CheckCircle2 size={18} className="text-blue-500 shrink-0" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tạo đề mới */}
                  {!showNewExamGuide ? (
                    <button
                      type="button"
                      onClick={() => setShowNewExamGuide(true)}
                      className="flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ExternalLink size={15} />
                      Tạo đề thi mới (sẽ cần anchor blockchain trước khi dùng)
                    </button>
                  ) : (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-0.5">
                          <ExternalLink size={13} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Tạo đề thi mới</p>
                          <p className="mt-0.5 text-xs leading-5 text-blue-700">
                            Sau khi tạo đề, đề cần được <strong>anchor blockchain</strong> trước khi có thể dùng.
                            Khi đề sẵn sàng, nhấn <strong>"Tải lại danh sách"</strong> để đề xuất hiện ở trên.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href="/teacher/exams/create"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <ExternalLink size={13} />
                          Mở trang tạo đề (tab mới)
                        </a>
                        <button
                          type="button"
                          onClick={() => void reloadExams()}
                          disabled={reloadingExams}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={reloadingExams ? 'animate-spin' : ''} />
                          {reloadingExams ? 'Đang tải...' : 'Tải lại danh sách'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewExamGuide(false)}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        ← Quay lại chọn đề
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Chọn sinh viên ── */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Đã chọn <strong>{studentIds.length}</strong> / {submissions.length} sinh viên
                    </p>
                    <button
                      type="button"
                      onClick={selectAllAbsent}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <RotateCcw size={12} />
                      Chỉ chọn người vắng
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {submissions.map((s) => (
                      <label
                        key={s.studentId}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={studentIds.includes(s.studentId)}
                          onChange={() => toggleStudent(s.studentId)}
                          className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                        />
                        <span className="font-semibold text-gray-900 w-24 shrink-0">{s.studentCode}</span>
                        <span className="text-gray-600 flex-1 truncate">{s.studentName}</span>
                        {!s.hasSubmitted ? (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Vắng</span>
                        ) : (
                          <span className="shrink-0 text-xs text-gray-400">
                            {s.finalScore !== null ? `${s.finalScore}đ` : s.autoScore !== null ? `${s.autoScore}đ` : '—'}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  {studentIds.length === 0 && (
                    <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
                      Phải chọn ít nhất một sinh viên.
                    </p>
                  )}

                  <p className="text-xs text-gray-400">
                    Lưu ý: điểm ca dự phòng sẽ <strong>ghi đè</strong> điểm ca gốc của sinh viên được chọn, dù điểm thấp hơn.
                  </p>
                </div>
              )}

              {/* ── STEP 3: Cấu hình ca ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Bắt đầu <span className="font-normal text-gray-400 text-xs">(sau {formatDateTime(sourceSchedule.endTime)})</span>
                      <input
                        type="datetime-local"
                        value={startTime}
                        min={toLocalInputValue(new Date(sourceEndTime.getTime() + 60_000))}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Kết thúc
                      <input
                        type="datetime-local"
                        value={endTime}
                        min={startTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Thời lượng làm bài (phút)
                      <input
                        type="number"
                        min={1}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Mật khẩu ca thi
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Không bắt buộc"
                        className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cấu hình giám sát</p>
                    {[
                      { label: 'Khoá tab', value: enableTabLock, set: setEnableTabLock },
                      { label: 'Bắt buộc toàn màn hình', value: requireFullscreen, set: setRequireFullscreen },
                      { label: 'Bật webcam', value: enableWebcam, set: setEnableWebcam },
                      { label: 'Giám sát màn hình', value: enableScreenMonitoring, set: setEnableScreenMonitoring },
                      { label: 'Chặn copy/paste', value: blockCopyPaste, set: setBlockCopyPaste },
                      { label: 'Chặn chuột phải', value: blockRightClick, set: setBlockRightClick },
                    ].map(({ label, value, set }) => (
                      <label key={label} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={value}
                          onClick={() => set(!value)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-blue-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>

                  {/* Tóm tắt */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-1 text-xs text-blue-800">
                    <p className="font-semibold">Tóm tắt ca dự phòng:</p>
                    <p>• Đề thi: {selectedExamId ? selectedExam?.title ?? 'Đề đã chọn' : 'Đề gốc (giữ nguyên)'}</p>
                    <p>• Sinh viên: {studentIds.length} người được phép thi</p>
                    <p>• Thời gian: {startTime ? formatDateTime(startTime) : '—'} → {endTime ? formatDateTime(endTime) : '—'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loadingEligibility && eligibility?.eligible && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-4">
            <button
              type="button"
              onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : onClose()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeft size={15} />
              {step === 1 ? 'Hủy' : 'Quay lại'}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                disabled={step === 2 && studentIds.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tiếp theo
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {saving ? 'Đang tạo...' : 'Tạo ca dự phòng'}
              </button>
            )}
          </div>
        )}

        {!loadingEligibility && !eligibility?.eligible && (
          <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
