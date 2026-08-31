import { ArrowLeft } from 'lucide-react'

export function ExamDetailBackButton({
  onBack,
  label = 'Quay lại quản lý đề thi',
}: {
  onBack: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  )
}
