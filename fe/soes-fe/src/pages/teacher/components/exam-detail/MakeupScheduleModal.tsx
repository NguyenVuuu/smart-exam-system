import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ExamSubmission } from '../../types/teacher-exam.types'

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export interface MakeupScheduleModalProps {
  isOpen: boolean
  submissions: ExamSubmission[]
  defaultDurationMinutes: number
  onClose: () => void
  onCreate: (input: {
    studentIds: string[]
    startTime: string
    endTime: string
    durationMinutes: number
    password?: string | null
  }) => Promise<void>
}

export default function MakeupScheduleModal({
  isOpen,
  submissions,
  defaultDurationMinutes,
  onClose,
  onCreate,
}: MakeupScheduleModalProps) {
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [startTime, setStartTime] = useState(() => toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)))
  const [endTime, setEndTime] = useState(() =>
    toLocalInputValue(new Date(Date.now() + (30 + defaultDurationMinutes) * 60 * 1000)),
  )
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const toggleStudent = (studentId: string) => {
    setStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    )
  }

  const submit = async () => {
    if (!studentIds.length) {
      toast.warning('Chọn ít nhất một sinh viên làm ca dự phòng.')
      return
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.')
      return
    }
    setSaving(true)
    try {
      await onCreate({
        studentIds,
        startTime,
        endTime,
        durationMinutes,
        password: password.trim() || null,
      })
    } catch {
      toast.error('Không thể tạo ca thi dự phòng.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Tạo ca thi dự phòng</h3>
            <p className="mt-1 text-sm text-gray-500">Chỉ sinh viên được chọn mới thấy và vào được ca này.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Bắt đầu
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Kết thúc
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Thời lượng làm bài
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Mật khẩu ca thi
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="Không bắt buộc"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Sinh viên được làm lại</p>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {submissions.map((submission) => (
                <label
                  key={submission.studentId}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={studentIds.includes(submission.studentId)}
                    onChange={() => toggleStudent(submission.studentId)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-900">{submission.studentCode}</span>
                  <span className="text-gray-600">{submission.studentName}</span>
                  {!submission.hasSubmitted && (
                    <span className="ml-auto rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      Không nộp
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Đang tạo...' : 'Tạo ca dự phòng'}
          </button>
        </div>
      </div>
    </div>
  )
}
