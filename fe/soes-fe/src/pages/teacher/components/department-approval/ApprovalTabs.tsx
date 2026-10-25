import type { ApprovalKind } from '../../types/teacher-approval.types'

interface ApprovalTabsProps {
  activeKind: ApprovalKind
  onSelectKind: (kind: ApprovalKind) => void
  canReviewQuestions: boolean
  canReviewExams: boolean
  questionCount: number
  examCount: number
}

export default function ApprovalTabs({
  activeKind,
  onSelectKind,
  canReviewQuestions,
  canReviewExams,
  questionCount,
  examCount,
}: ApprovalTabsProps) {
  return (
    <div className="inline-flex w-full max-w-md rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100">
      {canReviewQuestions && (
        <button
          type="button"
          onClick={() => onSelectKind('QUESTION')}
          className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
            activeKind === 'QUESTION'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Câu hỏi chờ duyệt ({questionCount})
        </button>
      )}
      {canReviewExams && (
        <button
          type="button"
          onClick={() => onSelectKind('EXAM')}
          className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
            activeKind === 'EXAM'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Đề cuối kỳ ({examCount})
        </button>
      )}
    </div>
  )
}
