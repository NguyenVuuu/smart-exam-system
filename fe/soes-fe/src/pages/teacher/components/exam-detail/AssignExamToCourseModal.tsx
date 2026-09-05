import { CheckCircle2, Send, Users, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage, getApiFieldErrors } from '../../../../api/errors'
import type { CourseOffering } from '../../types/teacher-course.types'
import type { ExamSchedule } from '../../types/teacher-exam.types'
import { ExamSessionForm, type ExamSessionDraft } from './session/ExamSessionForm'
import { ExamSessionList, parseSessionDateTime } from './session/ExamSessionList'

interface AssignExamToCourseModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  examTitle: string
  subjectName: string
  courses: CourseOffering[]
  defaultConfig?: Partial<ExamSessionDraft>
  initialSessions?: ExamSchedule[]
  initialEditingSessionId?: string | null
  onCreateSessions?: (sessions: ExamSchedule[]) => void | Promise<void>
}

const DEFAULT_DRAFT: ExamSessionDraft = {
  courseOfferingId: '',
  examDate: '',
  startTime: '',
  endTime: '',
  durationMinutes: 60,
  maxAttempts: 1,
  password: '',
  resultReleaseMode: 'MANUAL',
  resultReleaseAt: '',
  allowStudentReview: false,
  requireFullscreen: true,
  enableWebcam: true,
  blockCopyPaste: true,
  blockRightClick: true,
  ipMode: 'HOME',
  allowedIpRange: '',
  distributionMode: 'SHUFFLE_QUESTIONS_AND_OPTIONS',
  randomQuestionCount: 1,
}

export default function AssignExamToCourseModal(props: AssignExamToCourseModalProps) {
  if (!props.isOpen) return null
  return (
    <AssignExamToCourseModalContent
      key={`${props.isOpen ? 'open' : 'closed'}-${props.initialEditingSessionId ?? 'create'}`}
      {...props}
    />
  )
}

function AssignExamToCourseModalContent({
  onClose,
  examId,
  examTitle,
  subjectName,
  courses,
  defaultConfig,
  initialSessions,
  initialEditingSessionId,
  onCreateSessions,
}: AssignExamToCourseModalProps) {
  const isEditingExistingSession = Boolean(initialEditingSessionId)
  const editingTarget = initialSessions?.find((s) => s.id === initialEditingSessionId) ?? (isEditingExistingSession ? initialSessions?.[0] : null)

  const [draftSession, setDraftSession] = useState<ExamSessionDraft>(() => {
    if (editingTarget) {
      const parsedStart = parseSessionDateTime(editingTarget.startTime)
      const parsedEnd = parseSessionDateTime(editingTarget.endTime)
      return {
        ...DEFAULT_DRAFT,
        courseOfferingId: editingTarget.courseOfferingId,
        examDate: parsedStart.date,
        startTime: parsedStart.time,
        endTime: parsedEnd.time,
        durationMinutes: editingTarget.durationMinutes,
        maxAttempts: editingTarget.maxAttempts ?? 1,
        password: editingTarget.password ?? '',
        resultReleaseMode: editingTarget.resultReleaseMode ?? 'MANUAL',
        resultReleaseAt: editingTarget.resultReleaseAt ?? '',
        allowStudentReview: Boolean(editingTarget.allowStudentReview),
        requireFullscreen: editingTarget.requireFullscreen ?? true,
        enableWebcam: editingTarget.enableWebcam ?? true,
        blockCopyPaste: editingTarget.blockCopyPaste ?? true,
        blockRightClick: editingTarget.blockRightClick ?? true,
        ipMode: editingTarget.ipMode ?? 'HOME',
        allowedIpRange: editingTarget.allowedIpRange ?? '',
        distributionMode: editingTarget.distributionMode ?? 'SHUFFLE_QUESTIONS_AND_OPTIONS',
        randomQuestionCount: editingTarget.randomQuestionCount ?? 1,
      }
    }
    return {
      ...DEFAULT_DRAFT,
      ...defaultConfig,
    }
  })
  const [publishSessions, setPublishSessions] = useState<ExamSchedule[]>(initialSessions ?? [])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(initialEditingSessionId ?? null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ExamSessionDraft, string>>>({})

  const clearFieldError = (field: keyof ExamSessionDraft) => {
    setFieldErrors((current) => {
      const relatedFields: Partial<Record<keyof ExamSessionDraft, Array<keyof ExamSessionDraft>>> = {
        ipMode: ['allowedIpRange'],
        distributionMode: ['randomQuestionCount'],
        resultReleaseMode: ['resultReleaseAt'],
      }
      const fieldsToClear = [field, ...(relatedFields[field] ?? [])]
      if (!fieldsToClear.some((key) => current[key])) return current
      const next = { ...current }
      fieldsToClear.forEach((key) => delete next[key])
      return next
    })
  }

  const buildSessionFromDraft = (): ExamSchedule | null => {
    const course = courses.find((item) => item.id === draftSession.courseOfferingId)
    const validationErrors: Partial<Record<keyof ExamSessionDraft, string>> = {}

    if (!course || course.subjectName !== subjectName) {
      validationErrors.courseOfferingId = 'Vui lòng chọn lớp học phần.'
    }
    if (!draftSession.examDate) validationErrors.examDate = 'Vui lòng chọn ngày thi.'
    if (!draftSession.startTime) validationErrors.startTime = 'Vui lòng chọn giờ mở bài.'
    if (!draftSession.endTime) validationErrors.endTime = 'Vui lòng chọn giờ đóng ca.'
    if (draftSession.durationMinutes < 1) {
      validationErrors.durationMinutes = 'Thời lượng làm bài phải lớn hơn 0.'
    }
    if (draftSession.maxAttempts < 1) {
      validationErrors.maxAttempts = 'Số lần làm bài phải lớn hơn 0.'
    }
    const passwordLength = draftSession.password.trim().length
    if (passwordLength > 0 && (passwordLength < 4 || passwordLength > 100)) {
      validationErrors.password = 'Mật khẩu phải có từ 4 đến 100 ký tự.'
    }
    if (draftSession.resultReleaseMode === 'SCHEDULED' && !draftSession.resultReleaseAt) {
      validationErrors.resultReleaseAt = 'Vui lòng chọn thời gian công bố điểm.'
    }
    if (draftSession.ipMode === 'CAMPUS' && !draftSession.allowedIpRange.trim()) {
      validationErrors.allowedIpRange = 'Vui lòng nhập dải IP được phép.'
    }
    if (draftSession.distributionMode === 'RANDOM_SUBSET' && draftSession.randomQuestionCount < 1) {
      validationErrors.randomQuestionCount = 'Số câu hỏi ngẫu nhiên phải lớn hơn 0.'
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      toast.error('Vui lòng kiểm tra các trường đang báo lỗi.')
      return null
    }
    if (!course) return null

    const localStart = new Date(`${draftSession.examDate}T${draftSession.startTime}:00`)
    const localEnd = new Date(`${draftSession.examDate}T${draftSession.endTime}:00`)
    if (isNaN(localStart.getTime()) || isNaN(localEnd.getTime())) {
      setFieldErrors((current) => ({ ...current, examDate: 'Ngày hoặc giờ thi không hợp lệ.' }))
      toast.error('Thời gian ca thi không hợp lệ.')
      return null
    }
    if (localEnd <= localStart) {
      setFieldErrors((current) => ({ ...current, endTime: 'Giờ đóng ca phải sau giờ mở bài.' }))
      toast.error('Giờ đóng ca phải sau giờ mở bài.')
      return null
    }
    const startTime = localStart.toISOString()
    const endTime = localEnd.toISOString()
    return {
      id: editingSessionId ?? `session-${Date.now()}-${publishSessions.length}`,
      examId,
      courseOfferingId: course.id,
      courseCode: course.courseCode,
      subjectName: course.subjectName,
      startTime,
      endTime,
      durationMinutes: draftSession.durationMinutes,
      maxAttempts: draftSession.maxAttempts,
      password: draftSession.password.trim() || undefined,
      resultReleaseMode: draftSession.resultReleaseMode,
      resultReleaseAt:
        draftSession.resultReleaseMode === 'SCHEDULED' ? draftSession.resultReleaseAt : undefined,
      allowStudentReview: draftSession.allowStudentReview,
      requireFullscreen: draftSession.requireFullscreen,
      enableWebcam: draftSession.enableWebcam,
      blockCopyPaste: draftSession.blockCopyPaste,
      blockRightClick: draftSession.blockRightClick,
      ipMode: draftSession.ipMode,
      allowedIpRange: draftSession.ipMode === 'CAMPUS' ? draftSession.allowedIpRange : undefined,
      distributionMode: draftSession.distributionMode,
      randomQuestionCount: draftSession.distributionMode === 'RANDOM_SUBSET'
        ? draftSession.randomQuestionCount
        : null,
      status: 'SCHEDULED',
    }
  }

  const addPublishSession = () => {
    const nextSession = buildSessionFromDraft()
    if (!nextSession) return

    const exists = publishSessions.some(
      (session) =>
        session.id !== editingSessionId &&
        session.courseOfferingId === nextSession.courseOfferingId &&
        session.startTime === nextSession.startTime,
    )

    if (exists) {
      toast.error('Ca thi này đã có trong danh sách.')
      return
    }

    setPublishSessions((prev) =>
      editingSessionId
        ? prev.map((session) => (session.id === editingSessionId ? nextSession : session))
        : [...prev, nextSession],
    )
    setEditingSessionId(null)
  }

  const editPublishSession = (session: ExamSchedule) => {
    setEditingSessionId(session.id)
    const parsedStart = parseSessionDateTime(session.startTime)
    const parsedEnd = parseSessionDateTime(session.endTime)
    setDraftSession({
      courseOfferingId: session.courseOfferingId,
      examDate: parsedStart.date,
      startTime: parsedStart.time,
      endTime: parsedEnd.time,
      durationMinutes: session.durationMinutes,
      maxAttempts: session.maxAttempts ?? 1,
      password: session.password ?? '',
      resultReleaseMode: session.resultReleaseMode ?? 'MANUAL',
      resultReleaseAt: session.resultReleaseAt ?? '',
      allowStudentReview: Boolean(session.allowStudentReview),
      requireFullscreen: session.requireFullscreen ?? true,
      enableWebcam: session.enableWebcam ?? true,
      blockCopyPaste: session.blockCopyPaste ?? true,
      blockRightClick: session.blockRightClick ?? true,
      ipMode: session.ipMode ?? 'HOME',
      allowedIpRange: session.allowedIpRange ?? '',
      distributionMode: session.distributionMode ?? 'SHUFFLE_QUESTIONS_AND_OPTIONS',
      randomQuestionCount: session.randomQuestionCount ?? 1,
    })
  }

  const handlePublishToClass = async () => {
    const sessionsToSave = isEditingExistingSession
      ? [buildSessionFromDraft()].filter(Boolean)
      : publishSessions

    if (sessionsToSave.length === 0) {
      toast.error('Vui lòng thêm ít nhất một ca thi trước khi công bố.')
      return
    }

    try {
      await onCreateSessions?.(sessionsToSave as ExamSchedule[])
      setFieldErrors({})
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1200)
    } catch (error) {
      const apiErrors = getApiFieldErrors(error)
      const nextErrors: Partial<Record<keyof ExamSessionDraft, string>> = {
        courseOfferingId: apiErrors.courseOfferingId,
        startTime: apiErrors.startTime,
        endTime: apiErrors.endTime,
        durationMinutes: apiErrors.durationMinutes,
        maxAttempts: apiErrors.maxAttempts,
        password: apiErrors.password,
        resultReleaseAt: apiErrors.resultReleaseAt,
        allowedIpRange: apiErrors.allowedIpRanges,
        randomQuestionCount: apiErrors.randomQuestionCount,
      }
      setFieldErrors(Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message)))
      toast.error(
        Object.keys(apiErrors).length
          ? 'Vui lòng kiểm tra các trường đang báo lỗi.'
          : getApiErrorMessage(error, 'Không thể lưu ca thi. Vui lòng thử lại.'),
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="shrink-0 px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-950">
                {isEditingExistingSession ? 'Cập nhật ca thi' : 'Tạo ca thi / Phân lớp'}
              </h2>
              <p className="mt-1 truncate text-[13px] leading-[19px] text-slate-500">
                {examTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="min-h-0 flex-1 p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditingExistingSession ? 'Đã lưu thay đổi ca thi' : `Đã tạo ${publishSessions.length} ca thi`}
            </h3>
            <p className="text-xs text-gray-500">
              {isEditingExistingSession
                ? 'Lịch thi và cấu hình ca đã được cập nhật.'
                : 'Ca thi đã có cấu hình áp dụng riêng cho từng lớp.'}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-xs">
              <div className="space-y-5">
                <ExamSessionForm
                  draft={draftSession}
                  courses={courses}
                  onChange={setDraftSession}
                  fieldErrors={fieldErrors}
                  onFieldChange={clearFieldError}
                  onAdd={addPublishSession}
                  submitLabel={editingSessionId ? 'Cập nhật thông tin' : 'Thêm ca'}
                  showSubmit={!isEditingExistingSession}
                />

                {!isEditingExistingSession && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Danh sách ca thi sẽ công bố</h3>
                      <span className="text-xs text-gray-500">{publishSessions.length} ca thi</span>
                    </div>
                    <ExamSessionList
                      sessions={publishSessions}
                      variant="draft"
                      onEdit={editPublishSession}
                      onRemove={(sessionId) =>
                        setPublishSessions((prev) => prev.filter((session) => session.id !== sessionId))
                      }
                      emptyText="Thêm ít nhất một ca thi để công bố đề cho lớp."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handlePublishToClass}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send size={14} />
                {isEditingExistingSession ? 'Lưu thay đổi' : `Công bố ${publishSessions.length} ca thi`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
