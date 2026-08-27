import { CalendarClock, Eye, EyeOff, Globe, MonitorCheck, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { releaseLabel } from '../../../constants/ExamEditorConfig'
import type { ExamSchedule } from '../../../types/teacher-exam.types'

export default function ExamSessionDetailModal({
  session,
  onClose,
}: {
  session: ExamSchedule | null
  onClose: () => void
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  if (!session) return null

  const rules = [
    session.requireFullscreen ? 'Toàn màn hình' : null,
    session.enableWebcam ? 'Webcam' : null,
    session.blockCopyPaste ? 'Chặn copy/paste' : null,
    session.blockRightClick ? 'Chặn chuột phải' : null,
  ].filter((rule): rule is string => Boolean(rule))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarClock size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">Chi tiết ca thi</h2>
              <p className="mt-1 truncate text-[13px] leading-[19px] text-slate-500">
                {session.courseCode} • {session.subjectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailBox label="Trạng thái" value={statusLabel[session.status]} />
            <DetailBox label="Thời lượng" value={`${session.durationMinutes} phút`} />
            <DetailBox label="Số lần làm" value={`${session.maxAttempts ?? 1} lần`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoPanel
              icon={<Users size={15} className="text-blue-600" />}
              title="Lớp và lịch thi"
              lines={[
                ['Lớp học phần', session.courseCode],
                ['Môn học', session.subjectName],
                ['Giờ mở bài', session.startTime.replace('T', ' ')],
                ['Giờ đóng bài', session.endTime.replace('T', ' ')],
              ]}
            />
            <InfoPanel
              icon={<Globe size={15} className="text-blue-600" />}
              title="Truy cập và công bố điểm"
              lines={[
                [
                  'Mật khẩu',
                  session.password ? (
                    <PasswordValue
                      password={session.password}
                      visible={isPasswordVisible}
                      onToggle={() => setIsPasswordVisible((current) => !current)}
                    />
                  ) : 'Không bắt buộc',
                ],
                ['Hiển thị điểm', releaseLabel[session.resultReleaseMode ?? 'MANUAL']],
                ['Xem lại bài làm', session.allowStudentReview ? 'Sinh viên được xem lại sau khi công bố điểm' : 'Không cho sinh viên xem lại'],
                ['IP', session.ipMode === 'CAMPUS' ? 'Giới hạn IP trường' : 'Thi tại nhà/Online'],
                ['Dải IP', session.allowedIpRange ?? '-'],
              ]}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MonitorCheck size={16} className="text-blue-600" />
              Quy định chống gian lận
            </div>
            <div className="flex flex-wrap gap-2">
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <span key={rule} className="rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[13px] font-normal text-slate-700">
                    {rule}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">Không bật quy định đặc biệt.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailBox
              label="Phân phối đề"
              value={distributionModeLabel[session.distributionMode ?? 'FIXED_ORDER']}
            />
            <DetailBox label="Sinh viên đã vào thi" value="0 SV" />
            <DetailBox label="Bài nộp" value="0 bài" />
          </div>
        </div>
      </div>
    </div>
  )
}

const distributionModeLabel = {
  FIXED_ORDER: 'Giữ nguyên thứ tự câu hỏi',
  SHUFFLE_ORDER: 'Xáo thứ tự câu hỏi',
  SHUFFLE_QUESTIONS_AND_OPTIONS: 'Xáo câu hỏi và phương án',
  RANDOM_SUBSET: 'Chọn tập câu hỏi ngẫu nhiên theo phần',
} as const

const statusLabel: Record<ExamSchedule['status'], string> = {
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  OPEN: 'Đang mở thi',
  CLOSED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function InfoPanel({
  icon,
  title,
  lines,
}: {
  icon: ReactNode
  title: string
  lines: Array<[string, ReactNode]>
}) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="min-w-0 text-right font-normal text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PasswordValue({
  password,
  visible,
  onToggle,
}: {
  password: string
  visible: boolean
  onToggle: () => void
}) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="font-normal">{visible ? password : '••••••••'}</span>
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </span>
  )
}
