import { ClipboardList } from 'lucide-react'
import type { ExamTimelineItem as ExamTimelineItemType } from '../../../types/course-detail.types'

interface ExamTimelineItemProps {
  item: ExamTimelineItemType
  onClick: (id: string) => void
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

export default function ExamTimelineItem({ item, onClick }: ExamTimelineItemProps) {
  return (
    <div
      onClick={() => onClick(item.id)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-orange-50 rounded-xl shrink-0">
        <ClipboardList size={18} className="text-orange-500" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
          Bài thi
        </span>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mt-0.5 mb-2 line-clamp-2">
          {item.title}
        </h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
          <div>
            <span className="text-gray-400">Tác giả: </span>
            <span>{item.authorName}</span>
          </div>
          <div>
            <span className="text-gray-400">Thời lượng: </span>
            <span>{item.durationMinutes} phút</span>
          </div>
          <div>
            <span className="text-gray-400">Bắt đầu: </span>
            <span>{formatDateTime(item.startTime)}</span>
          </div>
          <div>
            <span className="text-gray-400">Kết thúc: </span>
            <span>{formatDateTime(item.endTime)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
