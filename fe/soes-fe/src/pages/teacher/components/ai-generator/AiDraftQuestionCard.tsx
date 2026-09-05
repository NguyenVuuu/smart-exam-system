import React from 'react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react'
import { QuestionProgrammingEditor } from '../question-bank/editor/QuestionProgrammingEditor'
import RichTextEditor from '../question-bank/editor/RichTextEditor'
import type { AIDraftQuestion, DifficultyLevel } from '../../types/teacher-question-bank.types'

export const difficultyLabel: Record<DifficultyLevel, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

export const difficultyTone: Record<DifficultyLevel, string> = {
  EASY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  HARD: 'border-rose-200 bg-rose-50 text-rose-700',
}

export const statusLabel: Record<AIDraftQuestion['status'], string> = {
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

export const questionTypeLabel: Record<string, string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

interface AiDraftQuestionCardProps {
  question: AIDraftQuestion
  index: number
  isCollapsed: boolean
  expandedTcIds: string[]
  onToggleCollapse: (questionId: string) => void
  onToggleExpandTc: (questionId: string, testCaseId: string) => void
  onUpdateField: <K extends keyof AIDraftQuestion>(
    id: string,
    field: K,
    value: AIDraftQuestion[K],
  ) => void
  onUpdateOptionContent: (questionId: string, optionId: string, content: string) => void
  onUpdateOptionCorrect: (questionId: string, optionId: string, checked: boolean) => void
  onUpdateTestCases: (
    questionId: string,
    testCases: NonNullable<AIDraftQuestion['testCases']>,
  ) => void
  onUpdateStatus: (id: string, status: AIDraftQuestion['status']) => void
}

export const AiDraftQuestionCard: React.FC<AiDraftQuestionCardProps> = ({
  question,
  index,
  isCollapsed,
  expandedTcIds,
  onToggleCollapse,
  onToggleExpandTc,
  onUpdateField,
  onUpdateOptionContent,
  onUpdateOptionCorrect,
  onUpdateTestCases,
  onUpdateStatus,
}) => {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-700">
              Câu nháp #{index + 1}
            </span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
              {questionTypeLabel[question.type] || question.type}
            </span>
            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${difficultyTone[question.difficulty]}`}>
              {difficultyLabel[question.difficulty]}
            </span>
          </div>
          {isCollapsed && (
            <p className="mt-1.5 truncate text-sm font-semibold text-gray-950">
              {question.title || question.content || 'Chưa có tiêu đề'}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              question.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700'
                : question.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {statusLabel[question.status]}
          </span>
          <button
            type="button"
            onClick={() => onToggleCollapse(question.id)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            title={isCollapsed ? 'Mở câu hỏi' : 'Thu gọn câu hỏi'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {question.aiDifficultyReason && (
            <p className="mt-3 text-xs leading-5 text-gray-500">
              <span className="font-semibold text-gray-600">Lý do xếp độ khó:</span> {question.aiDifficultyReason}
            </p>
          )}
          {question.type === 'PROGRAMMING' ? (
            <>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Tiêu đề bài</label>
                <input
                  value={question.title}
                  onChange={(event) => onUpdateField(question.id, 'title', event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả bài toán</label>
                <RichTextEditor
                  value={question.content}
                  onChange={(val) => onUpdateField(question.id, 'content', val)}
                  placeholder="Nhập mô tả bài toán..."
                  minHeight={200}
                  height={240}
                />
              </div>
              <div className="mt-3">
                <QuestionProgrammingEditor
                  programmingLanguage={question.programmingLanguage ?? 'JAVA'}
                  onLanguageChange={(value) => onUpdateField(question.id, 'programmingLanguage', value)}
                  timeLimitMs={question.timeLimitMs ?? 2000}
                  onTimeLimitChange={(value) => onUpdateField(question.id, 'timeLimitMs', value)}
                  memoryLimitMb={question.memoryLimitMb ?? 256}
                  onMemoryLimitChange={(value) => onUpdateField(question.id, 'memoryLimitMb', value)}
                  maxCodeSizeKb={question.maxCodeSizeKb ?? 256}
                  onMaxCodeSizeChange={(value) => onUpdateField(question.id, 'maxCodeSizeKb', value)}
                  testCases={question.testCases ?? []}
                  onTestCasesChange={(testCases) => onUpdateTestCases(question.id, testCases)}
                  expandedTcIds={expandedTcIds}
                  onToggleExpandTc={(testCaseId) => onToggleExpandTc(question.id, testCaseId)}
                />
              </div>
            </>
          ) : (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Câu hỏi</label>
              <textarea
                rows={2}
                value={question.content || question.title}
                onChange={(event) => {
                  onUpdateField(question.id, 'content', event.target.value)
                  onUpdateField(question.id, 'title', event.target.value)
                }}
                className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold leading-6 text-gray-950 outline-none focus:border-blue-500"
              />
            </div>
          )}

          {question.options && (
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                    option.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                    name={`correct-${question.id}`}
                    checked={option.isCorrect}
                    onChange={(event) =>
                      onUpdateOptionCorrect(question.id, option.id, event.target.checked)
                    }
                    className="shrink-0 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="shrink-0 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>
                  <input
                    value={option.content}
                    onChange={(event) =>
                      onUpdateOptionContent(question.id, option.id, event.target.value)
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                  {option.isCorrect && <Check size={14} className="shrink-0 text-emerald-600" />}
                </label>
              ))}
            </div>
          )}

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-gray-600">Giải thích</label>
            <textarea
              rows={2}
              value={question.explanation ?? ''}
              onChange={(event) => onUpdateField(question.id, 'explanation', event.target.value)}
              className="w-full resize-y rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs leading-5 text-blue-800 outline-none focus:border-blue-400"
              placeholder="Nhập hoặc chỉnh giải thích đáp án..."
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400">Nguồn: {question.sourceMaterialName}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus(question.id, 'REJECTED')}
                className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <XCircle size={14} />
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(question.id, 'APPROVED')}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} />
                Chấp nhận
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  )
}
