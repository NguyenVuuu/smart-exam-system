import { CalendarClock, Globe, MonitorCheck, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { releaseLabel } from '../../../constants/ExamEditorConfig'
import type { ExamSchedule } from '../../../types/teacher-exam.types'

export default function ExamSessionDetailModal({
  session,
  onClose,
}: {
  session: ExamSchedule | null
  onClose: () => void
}) {
  if (!session) return null

  const rules = [
    session.requireFullscreen ? 'Toàn màn hình' : null,
    session.enableWebcam ? 'Webcam' : null,
    session.blockCopyPaste ? 'Chặn copy/paste' : null,
    session.blockRightClick ? 'Chặn chuột phải' : null,
  ].filter((rule): rule is string => Boolean(rule))

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarClock size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-gray-900">Chi tiết ca</h2>
              <p className="text-xs text-gray-500 truncate">
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

        <div className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailBox label="Trạng thái" value={session.status} />
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
                ['Mật khẩu', session.password ? '••••••••' : 'Không bắt buộc'],
                ['Hiển thị điểm', releaseLabel[session.resultReleaseMode ?? 'MANUAL']],
                ['Xem lại bài làm', session.allowStudentReview ? 'Sinh viên được xem lại sau khi công bố điểm' : 'Không cho sinh viên xem lại'],
                ['IP', session.ipMode === 'CAMPUS' ? 'Giới hạn IP trường' : 'Thi tại nhà/Online'],
                ['Dải IP', session.allowedIpRange ?? '-'],
              ]}
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
              <MonitorCheck size={15} className="text-blue-600" />
              Quy định chống gian lận
            </div>
            <div className="flex flex-wrap gap-2">
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <span key={rule} className="px-2.5 py-1 rounded-lg bg-white border border-gray-100 text-gray-700">
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

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs text-gray-900 mt-0.5">{value}</p>
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
  lines: Array<[string, string]>
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="text-gray-500">{label}</span>
            <span className="text-right text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
