import { Download, File, FileText, FileCode } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { downloadPostAttachment } from '../../../api/student-course-detail.api'
import type { PostAttachment } from '../../../types/course-detail.types'

interface AttachmentItemProps {
  attachment: PostAttachment
}

function getFileIcon(fileType: string) {
  const type = fileType.toUpperCase()
  if (type === 'PDF') return <FileText size={16} className="text-red-500 shrink-0" />
  if (type === 'DOCX' || type === 'DOC') return <FileText size={16} className="text-blue-500 shrink-0" />
  if (type === 'PPTX' || type === 'PPT') return <FileText size={16} className="text-orange-500 shrink-0" />
  if (type === 'ZIP' || type === 'RAR') return <FileCode size={16} className="text-yellow-500 shrink-0" />
  return <File size={16} className="text-gray-400 shrink-0" />
}

export default function AttachmentItem({ attachment }: AttachmentItemProps) {
  const { courseOfferingId, postId } = useParams<{
    courseOfferingId: string
    postId: string
  }>()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!courseOfferingId || !postId || downloading) return
    setDownloading(true)
    try {
      await downloadPostAttachment(courseOfferingId, postId, attachment.id, attachment.fileName)
    } catch {
      // lỗi tải file — có thể toast nếu muốn
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={downloading}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
    >
      {getFileIcon(attachment.fileType)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{attachment.fileName}</p>
        <p className="mt-0.5 text-xs text-gray-400">{attachment.fileSize}</p>
      </div>
      <Download
        size={15}
        className={`shrink-0 transition-colors ${downloading ? 'text-gray-300' : 'text-blue-400'}`}
      />
    </button>
  )
}
