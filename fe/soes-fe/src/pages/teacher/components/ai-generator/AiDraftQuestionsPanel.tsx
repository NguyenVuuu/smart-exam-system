import React from 'react'
import { CheckCircle2, Sparkles, Trash2 } from 'lucide-react'
import { AiDraftQuestionCard } from './AiDraftQuestionCard'
import type { AIDraftQuestion } from '../../types/teacher-question-bank.types'
import type { AiMode } from './AiGeneratorConfigPanel'

interface AiDraftQuestionsPanelProps {
  draftPanelHeight?: number
  draftQuestions: AIDraftQuestion[]
  isGenerating: boolean
  aiMode: AiMode
  collapsedDraftQuestionIds: string[]
  expandedDraftTestCaseIds: Record<string, string[]>
  onApproveAllAvailable: () => void
  onClearDraftQuestions: () => void
  onToggleDraftQuestionCollapse: (questionId: string) => void
  onToggleDraftTestCase: (questionId: string, testCaseId: string) => void
  onUpdateDraftField: <K extends keyof AIDraftQuestion>(
    id: string,
    field: K,
    value: AIDraftQuestion[K],
  ) => void
  onUpdateDraftOptionContent: (questionId: string, optionId: string, content: string) => void
  onUpdateDraftOptionCorrect: (questionId: string, optionId: string, checked: boolean) => void
  onUpdateDraftTestCases: (
    questionId: string,
    testCases: NonNullable<AIDraftQuestion['testCases']>,
  ) => void
  onUpdateDraftStatus: (id: string, status: AIDraftQuestion['status']) => void
}

export const AiDraftQuestionsPanel: React.FC<AiDraftQuestionsPanelProps> = ({
  draftPanelHeight,
  draftQuestions,
  isGenerating,
  aiMode,
  collapsedDraftQuestionIds,
  expandedDraftTestCaseIds,
  onApproveAllAvailable,
  onClearDraftQuestions,
  onToggleDraftQuestionCollapse,
  onToggleDraftTestCase,
  onUpdateDraftField,
  onUpdateDraftOptionContent,
  onUpdateDraftOptionCorrect,
  onUpdateDraftTestCases,
  onUpdateDraftStatus,
}) => {
  return (
    <section
      className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:min-h-0"
      style={draftPanelHeight ? { height: draftPanelHeight } : undefined}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-950">Câu hỏi nháp</h2>
          <p className="mt-1 text-xs text-gray-500">
            Duyệt từng câu trước khi lưu vào ngân hàng cá nhân.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draftQuestions.length > 0 && (
            <>
              <button
                type="button"
                onClick={onApproveAllAvailable}
                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <CheckCircle2 size={14} />
                Chấp nhận tất cả
              </button>
              <button
                type="button"
                onClick={onClearDraftQuestions}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 size={14} />
                Xóa nháp
              </button>
            </>
          )}
          <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {draftQuestions.filter((item) => item.status === 'APPROVED').length} / {draftQuestions.length} đã duyệt
          </span>
        </div>
      </div>

      {isGenerating ? (
        <div className="flex min-h-[460px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/20 text-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-16 w-16 rounded-full bg-blue-400/20 animate-ping opacity-75" style={{ animationDuration: '1.8s' }} />
            <span className="absolute h-10 w-10 rounded-full bg-blue-500/30 animate-ping opacity-90" style={{ animationDuration: '1.2s' }} />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
              <Sparkles size={24} className="text-amber-300 animate-bounce" style={{ animationDuration: '1s' }} />
            </div>
          </div>

          <p className="mt-4 text-sm font-bold text-gray-950">
            {aiMode === 'EXTRACT_EXISTING_EXAM' ? 'AI đang bóc tách câu hỏi...' : 'AI đang sinh câu hỏi...'}
          </p>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            Đang phân tích tài liệu và cấu trúc câu hỏi, vui lòng đợi trong giây lát.
          </p>
        </div>
      ) : draftQuestions.length === 0 ? (
        <div className="flex min-h-[460px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
          <Sparkles size={28} className="text-blue-500" />
          <p className="mt-3 text-sm font-bold text-gray-950">Chưa có câu hỏi nháp</p>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Chọn nguồn dữ liệu và chế độ xử lý, sau đó bấm sinh câu hỏi.
          </p>
        </div>
      ) : (
        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {draftQuestions.map((question, index) => (
            <AiDraftQuestionCard
              key={question.id}
              question={question}
              index={index}
              isCollapsed={collapsedDraftQuestionIds.includes(question.id)}
              expandedTcIds={expandedDraftTestCaseIds[question.id] ?? []}
              onToggleCollapse={onToggleDraftQuestionCollapse}
              onToggleExpandTc={onToggleDraftTestCase}
              onUpdateField={onUpdateDraftField}
              onUpdateOptionContent={onUpdateDraftOptionContent}
              onUpdateOptionCorrect={onUpdateDraftOptionCorrect}
              onUpdateTestCases={onUpdateDraftTestCases}
              onUpdateStatus={onUpdateDraftStatus}
            />
          ))}
        </div>
      )}
    </section>
  )
}
