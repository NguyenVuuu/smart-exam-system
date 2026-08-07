import { ClipboardX } from 'lucide-react'

interface ExamEmptyProps {
  onBack: () => void
}

export default function ExamEmpty({ onBack }: ExamEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <ClipboardX size={36} className="text-gray-200" />
      <p className="text-sm">Không tìm thấy bài thi.</p>
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Quay lại
      </button>
    </div>
  )
}
