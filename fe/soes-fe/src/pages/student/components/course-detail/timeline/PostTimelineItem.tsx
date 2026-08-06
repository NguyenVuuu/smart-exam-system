import { FileText, Paperclip } from 'lucide-react'
import type { PostTimelineItem as PostTimelineItemType } from '../../../types/course-detail.types'

interface PostTimelineItemProps {
  item: PostTimelineItemType
  onClick: (id: string) => void
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`

  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function PostTimelineItem({ item, onClick }: PostTimelineItemProps) {
  return (
    <div
      onClick={() => onClick(item.id)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 rounded-xl shrink-0">
        <FileText size={18} className="text-indigo-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
              Bài đăng
            </span>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug mt-0.5 line-clamp-2">
              {item.title}
            </h3>
          </div>
          {item.edited && (
            <span className="text-xs text-gray-400 shrink-0 mt-0.5">Đã chỉnh sửa</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>{item.authorName}</span>
          <span className="text-gray-300">·</span>
          <span>{formatRelativeTime(item.publishedAt)}</span>
          {item.hasAttachment && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <Paperclip size={11} />
                Có đính kèm
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
