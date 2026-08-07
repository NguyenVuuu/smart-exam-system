import { File, FileText, FileCode } from 'lucide-react'
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
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
      {getFileIcon(attachment.fileType)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{attachment.fileName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{attachment.fileSize}</p>
      </div>
    </div>
  )
}
