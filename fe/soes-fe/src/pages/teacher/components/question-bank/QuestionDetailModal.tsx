import { Check, Code, Eye, EyeOff, X } from 'lucide-react'
import { PROGRAMMING_LANGUAGE_LABELS } from '../../../../constants/programmingLanguages'
import HtmlContent from '../../../../components/common/HtmlContent'
import type { DifficultyLevel, Question, QuestionType } from '../../types/teacher-question-bank.types'

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

const difficultyLabel: Record<DifficultyLevel, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const difficultyTone: Record<DifficultyLevel, string> = {
  EASY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  HARD: 'border-rose-200 bg-rose-50 text-rose-700',
}

const vietnameseDateTime = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
})

function formatVietnameseDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : vietnameseDateTime.format(date)
}

export default function QuestionDetailModal({
  isOpen,
  onClose,
  question,
}: QuestionDetailModalProps) {
  if (!isOpen || !question) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 shrink-0">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg">
                {question.subjectName || 'Chưa gán môn học'}
              </span>
              <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${difficultyTone[question.difficulty]}`}>
                {difficultyLabel[question.difficulty]}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                {questionTypeLabel[question.type]}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-6 text-gray-950">{question.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 px-6 py-5 text-sm text-gray-800">
          {question.type === 'PROGRAMMING' && (
            <div>
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1">
                Mô tả bài toán
              </span>
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-sm font-medium text-gray-900">
                <HtmlContent content={question.content} />
              </div>
            </div>
          )}

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
              <div className="flex flex-col gap-3 border-b border-gray-200/60 pb-3 md:flex-row md:items-center md:justify-between">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Code size={16} /> Ngôn ngữ: {question.programmingLanguage ? PROGRAMMING_LANGUAGE_LABELS[question.programmingLanguage] : 'Chưa chọn'}
                </span>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  <ConfigPill label="Thời gian" value={`${question.timeLimitMs || 2000}ms`} />
                  <ConfigPill label="Bộ nhớ" value={`${question.memoryLimitMb || 256}MB`} />
                  <ConfigPill label="Mã nguồn" value={`${question.maxCodeSizeKb || 64}KB`} />
                </div>
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
                    <div className="grid grid-cols-1 gap-2 text-xs font-mono pt-1 md:grid-cols-2">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-400 block text-xs">Input:</span>
                        <pre className="whitespace-pre-wrap break-words text-gray-800">{tc.input}</pre>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-400 block text-xs">Expected Output:</span>
                        <pre className="whitespace-pre-wrap break-words text-emerald-700 font-bold">{tc.expectedOutput}</pre>
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

          {question.removedAt && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="font-bold text-gray-800 block text-xs">
                Trạng thái ngân hàng chung:
              </span>
              <p className="text-gray-700 leading-relaxed">
                Câu hỏi đã được gỡ khỏi ngân hàng chung
                {question.removedByName ? ` bởi ${question.removedByName}` : ''}
                {question.removedAt ? ` vào ${formatVietnameseDateTime(question.removedAt)}` : ''}.
              </p>
              {question.removalReason && (
                <p className="text-gray-500 leading-relaxed">Lý do: {question.removalReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 shrink-0">
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

function ConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-medium">
      {label}: <strong className="text-gray-900">{value}</strong>
    </span>
  )
}
