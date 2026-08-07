import { FileText, Paperclip, RefreshCw } from 'lucide-react'
import type { PostDetail as PostDetailType } from '../../../types/course-detail.types'
import AttachmentItem from './AttachmentItem'

interface PostDetailProps {
  data: PostDetailType
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

function PostDetailSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-40" />
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  )
}

export { PostDetailSkeleton }

export default function PostDetail({ data }: PostDetailProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 rounded-xl shrink-0">
          <FileText size={18} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
            Bài đăng
          </span>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug mt-0.5">
            {data.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
            <span>{formatDateTime(data.publishedAt)}</span>
            {data.edited && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <RefreshCw size={11} />
                  Đã chỉnh sửa
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-5" />

      {/* Content */}
      {data.content && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">
          {data.content}
        </p>
      )}

      {/* Attachments */}
      {data.attachments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Paperclip size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tệp đính kèm ({data.attachments.length})
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {data.attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
