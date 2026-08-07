import { ClipboardX } from 'lucide-react'

interface ExamErrorProps {
  message: string
  onRetry: () => void
}

export default function ExamError({ message, onRetry }: ExamErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <ClipboardX size={36} className="text-gray-200" />
      <p className="text-sm text-red-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Thử lại
      </button>
    </div>
  )
}
