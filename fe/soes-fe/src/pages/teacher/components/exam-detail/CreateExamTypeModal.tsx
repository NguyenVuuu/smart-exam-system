import { ArrowRight, CheckCircle2, Code, FileText, Layers, X } from 'lucide-react'
import { useState } from 'react'
import type { ExamType } from '../../types/teacher-exam.types'
import { examTypeBadge, examTypeDescription, examTypeLabel } from '../../constants/ExamEditorConfig'

interface CreateExamTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: ExamType) => void
}

interface TypeOption {
  id: ExamType
  title: string
  desc: string
  icon: React.ReactNode
  badge: string
  color: string
}

const EXAM_TYPES: TypeOption[] = [
  {
    id: 'MULTIPLE_CHOICE',
    title: examTypeLabel.MULTIPLE_CHOICE,
    desc: examTypeDescription.MULTIPLE_CHOICE,
    icon: <FileText size={24} className="text-blue-600" />,
    badge: examTypeBadge.MULTIPLE_CHOICE,
    color: 'border-blue-200 hover:border-blue-500 bg-blue-50/30',
  },
  {
    id: 'PROGRAMMING',
    title: examTypeLabel.PROGRAMMING,
    desc: examTypeDescription.PROGRAMMING,
    icon: <Code size={24} className="text-purple-600" />,
    badge: examTypeBadge.PROGRAMMING,
    color: 'border-purple-200 hover:border-purple-500 bg-purple-50/30',
  },
  {
    id: 'MIXED',
    title: examTypeLabel.MIXED,
    desc: examTypeDescription.MIXED,
    icon: <Layers size={24} className="text-amber-600" />,
    badge: examTypeBadge.MIXED,
    color: 'border-amber-200 hover:border-amber-500 bg-amber-50/30',
  },
]

export default function CreateExamTypeModal({
  isOpen,
  onClose,
  onSelectType,
}: CreateExamTypeModalProps) {
  const [selected, setSelected] = useState<ExamType>('MULTIPLE_CHOICE')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
              <h3 className="text-base font-bold text-gray-900">Chọn loại đề thi</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Hệ thống sẽ mở đúng bố cục soạn đề và lọc ngân hàng câu hỏi phù hợp
              </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAM_TYPES.map((type) => {
            const isChecked = selected === type.id
            return (
              <div
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {type.icon}
                    {isChecked && <CheckCircle2 size={18} className="text-blue-600 shrink-0" />}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">{type.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{type.desc}</p>
                </div>

                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-white border border-gray-200 text-gray-700 rounded-md w-fit">
                  {type.badge}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">
            Hủy
          </button>
          <button
            onClick={() => {
              onSelectType(selected)
              onClose()
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            Tiếp tục soạn bài thi <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
