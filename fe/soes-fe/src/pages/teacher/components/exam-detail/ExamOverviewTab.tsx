import { Clock, Globe } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Exam } from '../../types/teacher-exam.types'

export function ExamOverviewTab({
  exam,
  resultReleaseText,
}: {
  exam: Exam
  resultReleaseText: string
}) {
  const firstSchedule = exam.schedules?.[0]
  const scheduleTime = firstSchedule
    ? `${formatScheduleDateTime(firstSchedule.startTime)} - ${formatScheduleTime(firstSchedule.endTime)}`
    : 'Chưa tạo ca thi'
  const attemptText = firstSchedule ? `Ca đầu: tối đa ${firstSchedule.maxAttempts ?? 1} lần làm` : undefined
  const ipModeText = !firstSchedule
    ? 'Chưa cấu hình ca thi'
    : firstSchedule.ipMode === 'CAMPUS'
    ? 'Giới hạn mạng trường'
    : 'Thi trực tuyến ngoài trường'
  const ipDescription = firstSchedule?.ipMode === 'CAMPUS'
    ? `Dải IP cho phép: ${firstSchedule.allowedIpRange || 'Chưa nhập'}`
    : 'Ghi nhận địa chỉ IP và cảnh báo khi thay đổi trong lúc thi.'

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Chi tiết cấu hình bài thi</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ConfigInfoCard label="Thời gian mở ca" value={scheduleTime} />
        <ConfigInfoCard
          label="Thời lượng làm bài"
          value={`${exam.defaultDurationMinutes} phút mặc định`}
          description={attemptText}
        />
        <ConfigInfoCard
          icon={<Globe size={15} />}
          label="Chế độ kiểm soát IP"
          value={ipModeText}
          description={ipDescription}
          tone="blue"
        />
        <ConfigInfoCard
          icon={<Clock size={15} />}
          label="Hiển thị điểm"
          value={resultReleaseText}
          tone="emerald"
        />
      </div>
    </div>
  )
}

function ConfigInfoCard({
  icon,
  label,
  value,
  description,
  tone = 'gray',
}: {
  icon?: ReactNode
  label: string
  value: string
  description?: string
  tone?: 'gray' | 'blue' | 'emerald'
}) {
  const toneClassName = {
    gray: 'border-gray-100 bg-gray-50 text-slate-500',
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  }[tone]

  return (
    <div className={`space-y-1.5 rounded-xl border px-4 py-3.5 ${toneClassName}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold leading-[19px]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-normal leading-5 text-slate-900">{value}</p>
      {description && (
        <p className="text-[13px] font-normal leading-[19px] text-slate-500">{description}</p>
      )}
    </div>
  )
}

function formatScheduleDateTime(value: string) {
  const { date, time } = parseScheduleDateTime(value)
  return `${formatDisplayDate(date)} ${time}`
}

function formatScheduleTime(value: string) {
  return parseScheduleDateTime(value).time
}

function parseScheduleDateTime(value: string) {
  const [date = '', rawTime = ''] = value.includes('T') ? value.split('T') : value.split(' ')
  return {
    date,
    time: rawTime.slice(0, 5),
  }
}

function formatDisplayDate(date: string) {
  const [year, month, day] = date.split('-')
  return year && month && day ? `${day}/${month}/${year}` : date
}
