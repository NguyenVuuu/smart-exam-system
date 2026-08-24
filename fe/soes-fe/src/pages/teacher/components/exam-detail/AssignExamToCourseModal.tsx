import { CheckCircle2, Send, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MOCK_TEACHER_COURSES } from '../../mock/teacher-course.mock'
import type { ExamAssignment } from '../../types/teacher-exam.types'
import { ExamSessionForm, type ExamSessionDraft } from './session/ExamSessionForm'
import { ExamSessionList } from './session/ExamSessionList'

interface AssignExamToCourseModalProps {
  isOpen: boolean
  onClose: () => void
  examTitle: string
  defaultConfig?: Partial<ExamSessionDraft>
  initialSessions?: ExamAssignment[]
  initialEditingSessionId?: string | null
  onCreateSessions?: (sessions: ExamAssignment[]) => void
}

const DEFAULT_DRAFT: ExamSessionDraft = {
  courseOfferingId: 'co-01',
  examDate: '2026-08-25',
  startTime: '08:00',
  durationMinutes: 60,
  maxAttempts: 1,
  password: '',
  resultReleaseMode: 'MANUAL',
  resultReleaseAt: '2026-08-25T18:00',
  allowStudentReview: false,
  requireFullscreen: true,
  enableWebcam: true,
  blockCopyPaste: true,
  blockRightClick: true,
  ipMode: 'HOME',
  allowedIpRange: '192.168.1.1 - 192.168.1.254',
  distributionMode: 'RANDOM_ONLINE',
}

export default function AssignExamToCourseModal({
  isOpen,
  onClose,
  examTitle,
  defaultConfig,
  initialSessions,
  initialEditingSessionId,
  onCreateSessions,
}: AssignExamToCourseModalProps) {
  const isEditingExistingSession = Boolean(initialEditingSessionId)
  const [draftSession, setDraftSession] = useState<ExamSessionDraft>({
    ...DEFAULT_DRAFT,
    ...defaultConfig,
  })
  const [publishSessions, setPublishSessions] = useState<ExamAssignment[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setDraftSession({
      ...DEFAULT_DRAFT,
      ...defaultConfig,
    })
    setPublishSessions(initialSessions ?? [])
    setEditingSessionId(initialEditingSessionId ?? null)
  }, [isOpen])

  if (!isOpen) return null

  const buildSessionFromDraft = (): ExamAssignment | null => {
    const course = MOCK_TEACHER_COURSES.find((item) => item.id === draftSession.courseOfferingId)
    if (!course) return null

    const startTime = `${draftSession.examDate}T${draftSession.startTime}`
    return {
      id: editingSessionId ?? `session-${Date.now()}-${publishSessions.length}`,
      courseOfferingId: course.id,
      courseCode: course.courseCode,
      subjectName: course.subjectName,
      startTime,
      endTime: calculateEndTime(startTime, draftSession.durationMinutes),
      durationMinutes: draftSession.durationMinutes,
      maxAttempts: draftSession.maxAttempts,
      password: draftSession.password,
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
      alert('Ca thi này đã có trong danh sách.')
      return
    }

    setPublishSessions((prev) =>
      editingSessionId
        ? prev.map((session) => (session.id === editingSessionId ? nextSession : session))
        : [...prev, nextSession],
    )
    setEditingSessionId(null)
  }

  const editPublishSession = (session: ExamAssignment) => {
    setEditingSessionId(session.id)
    setDraftSession({
      courseOfferingId: session.courseOfferingId,
      examDate: session.startTime.slice(0, 10),
      startTime: session.startTime.slice(11, 16),
      durationMinutes: session.durationMinutes,
      maxAttempts: session.maxAttempts ?? 1,
      password: session.password ?? '',
      resultReleaseMode: session.resultReleaseMode ?? 'MANUAL',
      resultReleaseAt: session.resultReleaseAt ?? DEFAULT_DRAFT.resultReleaseAt,
      allowStudentReview: Boolean(session.allowStudentReview),
      requireFullscreen: Boolean(session.requireFullscreen),
      enableWebcam: Boolean(session.enableWebcam),
      blockCopyPaste: Boolean(session.blockCopyPaste),
      blockRightClick: Boolean(session.blockRightClick),
      ipMode: session.ipMode ?? 'HOME',
      allowedIpRange: session.allowedIpRange ?? DEFAULT_DRAFT.allowedIpRange,
      distributionMode: session.distributionMode ?? 'RANDOM_ONLINE',
    })
  }

  const handlePublishToClass = () => {
    const sessionsToSave = isEditingExistingSession
      ? [buildSessionFromDraft()].filter(Boolean)
      : publishSessions

    if (sessionsToSave.length === 0) {
      alert('Vui lòng thêm ít nhất một ca thi trước khi công bố.')
      return
    }

    onCreateSessions?.(sessionsToSave as ExamAssignment[])
    setIsSuccess(true)
    setTimeout(() => {
      setIsSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900">
                {isEditingExistingSession ? 'Cập nhật ca thi' : 'Tạo ca thi / Phân lớp'}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
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
          <div className="p-8 text-center space-y-3">
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
          <div className="p-6 space-y-5 text-xs max-h-[calc(100vh-180px)] overflow-y-auto">
            <ExamSessionForm
              draft={draftSession}
              onChange={setDraftSession}
              onAdd={addPublishSession}
              submitLabel={editingSessionId ? 'Cập nhật thông tin' : 'Thêm ca'}
              showSubmit={!isEditingExistingSession}
            />

            {!isEditingExistingSession && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900">Danh sách ca thi sẽ công bố</h3>
                  <span className="text-[11px] text-gray-500">{publishSessions.length} ca thi</span>
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
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
          </div>
        )}
      </div>
    </div>
  )
}

function calculateEndTime(startTime: string, durationMinutes: number) {
  const date = new Date(startTime)
  date.setMinutes(date.getMinutes() + durationMinutes)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}
