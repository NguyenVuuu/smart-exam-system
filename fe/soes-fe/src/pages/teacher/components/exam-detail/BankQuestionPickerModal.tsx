import { CheckCircle2, Database, RotateCcw, Search, X } from 'lucide-react'
import { useState } from 'react'
import { MOCK_QUESTION_BANK } from '../../mock/teacher-question-bank.mock'
import type { ExamType } from '../../types/teacher-exam.types'
import type { Question, QuestionType } from '../../types/teacher-question-bank.types'

interface BankQuestionPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectQuestions: (selectedQuestions: Question[]) => void
  existingQuestionIds: string[]
  examType: ExamType
}

export default function BankQuestionPickerModal({
  isOpen,
  onClose,
  onSelectQuestions,
  existingQuestionIds,
  examType,
}: BankQuestionPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const questionTypeLabel: Record<QuestionType, string> = {
    SINGLE_CHOICE: '1 đáp án đúng',
    MULTIPLE_CHOICE: 'Nhiều đáp án đúng',
    TRUE_FALSE: 'Đúng / Sai',
    PROGRAMMING: 'Lập trình',
  }

  // Filter based on Exam Type
  const filteredQuestions = MOCK_QUESTION_BANK.filter((q) => {
    const isAlreadyInExam = existingQuestionIds.includes(q.id)
    const matchesSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesExamType = true
    if (examType === 'MULTIPLE_CHOICE') {
      matchesExamType =
        q.type === 'SINGLE_CHOICE' ||
        q.type === 'MULTIPLE_CHOICE' ||
        q.type === 'TRUE_FALSE'
    } else if (examType === 'PROGRAMMING') {
      matchesExamType = q.type === 'PROGRAMMING'
    } else if (examType === 'MIXED') {
      matchesExamType =
        q.type === 'SINGLE_CHOICE' ||
        q.type === 'MULTIPLE_CHOICE' ||
        q.type === 'TRUE_FALSE' ||
        q.type === 'PROGRAMMING'
    }

    return !isAlreadyInExam && matchesSearch && matchesExamType
  })

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleConfirmAdd = () => {
    const selectedObjList = MOCK_QUESTION_BANK.filter((q) => selectedIds.includes(q.id))
    onSelectQuestions(selectedObjList)
    setSelectedIds([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Chọn Câu Hỏi Từ Ngân Hàng</h3>
              <p className="text-[11px] text-gray-500">
                Đang lọc cho loại đề: <span className="font-bold text-blue-600">{examType === 'MULTIPLE_CHOICE' ? 'Đề trắc nghiệm' : examType === 'PROGRAMMING' ? 'Đề lập trình' : 'Đề hỗn hợp'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Search & Reset Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 relative">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi từ ngân hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none w-full pr-4"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            title="Làm mới tìm kiếm"
          >
            <RotateCcw size={13} /> Làm mới
          </button>
        </div>

        {/* Question Picker List */}
        <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/40">
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">
              Không có câu hỏi phù hợp trong Ngân hàng.
            </p>
          ) : (
            filteredQuestions.map((q) => {
              const isChecked = selectedIds.includes(q.id)
              return (
                <label
                  key={q.id}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer block space-y-2 ${
                    isChecked ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-gray-200/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md">
                          {q.type === 'PROGRAMMING'
                            ? `Lập trình ${q.programmingLanguage}`
                            : questionTypeLabel[q.type]}
                        </span>
                        <span className="text-[10px] text-gray-400">• {q.bankScope === 'SHARED' ? 'Ngân hàng chung' : 'Cá nhân'}</span>
                        <span className="text-[10px] text-gray-400">• Môn: {q.subjectName}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900">{q.content}</p>
                    </div>
                  </div>
                </label>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">
            Hủy
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={handleConfirmAdd}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} /> Thêm {selectedIds.length} câu hỏi đã chọn vào Đề thi
          </button>
        </div>
      </div>
    </div>
  )
}
