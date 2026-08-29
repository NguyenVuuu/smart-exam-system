import { Calendar, Camera, Clock, Hash, RefreshCw } from 'lucide-react'
import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamInformationProps {
  data: ExamDetail
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function ExamInformation({ data }: ExamInformationProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Thông tin bài thi</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow
          icon={<Calendar size={15} className="text-gray-400" />}
          label="Thời gian bắt đầu"
          value={formatDateTime(data.startTime)}
        />
        <InfoRow
          icon={<Calendar size={15} className="text-gray-400" />}
          label="Thời gian kết thúc"
          value={formatDateTime(data.endTime)}
        />
        <InfoRow
          icon={<Clock size={15} className="text-gray-400" />}
          label="Thời lượng"
          value={`${data.durationMinutes} phút`}
        />
        <InfoRow
          icon={<RefreshCw size={15} className="text-gray-400" />}
          label="Số lần được làm"
          value={String(data.maxAttempts)}
        />
        <InfoRow
          icon={<Hash size={15} className="text-gray-400" />}
          label="Đã sử dụng"
          value={`${data.attemptUsed} / ${data.maxAttempts}`}
        />
        <InfoRow
          icon={<Hash size={15} className="text-gray-400" />}
          label="Còn lại"
          value={`${data.remainingAttempts} lượt`}
        />
        <InfoRow
          icon={<Camera size={15} className={data.enableWebcam ? 'text-emerald-500' : 'text-gray-400'} />}
          label="Yêu cầu camera"
          value={data.enableWebcam ? 'Bắt buộc bật trong khi thi' : 'Không bắt buộc'}
        />
      </div>
    </div>
  )
}
