import { Check, Code, Eye, EyeOff, X } from 'lucide-react'
import type { Question, QuestionType } from '../../types/teacher-question-bank.types'

interface QuestionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  question: Question | null
}

const questionTypeLabel: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm 1 đáp án',
  MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình (Code)',
}

export default function QuestionDetailModal({
  isOpen,
  onClose,
  question,
}: QuestionDetailModalProps) {
  if (!isOpen || !question) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg">
              {question.subjectName || 'Lập trình Java'}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                question.difficulty === 'EASY'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : question.difficulty === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {question.difficulty}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
              {questionTypeLabel[question.type]}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-gray-800">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1">
              Nội dung câu hỏi:
            </span>
            <p className="text-xs font-bold text-gray-900 leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
              {question.content}
            </p>
          </div>

          {/* MCQ Options */}
          {(question.type === 'SINGLE_CHOICE' ||
            question.type === 'MULTIPLE_CHOICE' ||
            question.type === 'TRUE_FALSE') &&
            question.options && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider block">
                Danh sách lựa chọn đáp án:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt, i) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.content}</span>
                    </span>
                    {opt.isCorrect && (
                      <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1 shrink-0">
                        <Check size={14} /> Đáp án đúng
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding Testcases */}
          {question.type === 'PROGRAMMING' && question.testCases && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between font-bold text-gray-800 border-b border-gray-200/60 pb-2">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Code size={16} /> Ngôn ngữ: {question.programmingLanguage || 'JAVA'}
                </span>
                <span className="text-gray-500 font-normal text-xs">
                  Time Limit: {question.timeLimitMs || 2000}ms | Memory Limit: {question.memoryLimitMb || 256}MB
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-700 block">Danh sách Test cases (Judge0):</span>
                {question.testCases.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className="bg-white p-3 rounded-lg border border-gray-200 space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-700">Test Case #{idx + 1}</span>
                      {tc.isHidden ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-center gap-1">
                          <EyeOff size={12} /> Test ẩn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
                          <Eye size={12} /> Public
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-400 block text-xs">Input:</span>
                        <code className="text-gray-800">{tc.input}</code>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-400 block text-xs">Expected Output:</span>
                        <code className="text-emerald-700 font-bold">{tc.expectedOutput}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
              <span className="font-bold text-blue-900 block text-xs">
                Lời giải / Giải thích chi tiết:
              </span>
              <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  )
}
