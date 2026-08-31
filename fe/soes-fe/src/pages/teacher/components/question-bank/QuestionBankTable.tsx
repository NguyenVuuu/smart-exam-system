import { Archive, ArchiveRestore, CloudUpload, Edit, Eye, XCircle } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { Question, QuestionType } from '../../types/teacher-question-bank.types'

type BadgeTone = 'gray' | 'blue' | 'emerald' | 'amber' | 'rose'

const questionTypeBadge: Record<QuestionType, { label: string; tone: BadgeTone }> = {
  SINGLE_CHOICE: {
    label: 'Trắc nghiệm 1 đáp án',
    tone: 'blue',
  },
  MULTIPLE_CHOICE: {
    label: 'Trắc nghiệm nhiều đáp án',
    tone: 'blue',
  },
  TRUE_FALSE: {
    label: 'Đúng / Sai',
    tone: 'amber',
  },
  PROGRAMMING: {
    label: 'Lập trình (Code)',
    tone: 'emerald',
  },
}

const difficultyBadge = {
  EASY: {
    label: 'EASY',
    tone: 'emerald',
  },
  MEDIUM: {
    label: 'MEDIUM',
    tone: 'amber',
  },
  HARD: {
    label: 'HARD',
    tone: 'rose',
  },
} satisfies Record<Question['difficulty'], { label: string; tone: BadgeTone }>

export default function QuestionBankTable({
  questions,
  activeTab,
  canApproveSharedQuestions,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onShare,
  onRemoveFromShared,
}: {
  questions: Question[]
  activeTab: 'PERSONAL' | 'SHARED'
  canApproveSharedQuestions: boolean
  onView: (q: Question) => void
  onEdit: (q: Question) => void
  onArchive: (q: Question) => void
  onRestore: (q: Question) => void
  onShare: (qId: string) => void
  onRemoveFromShared: (q: Question) => void
}) {
  const columns: ColumnDef<Question>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'CÂU HỎI',
      render: (q) => (
        <div className="min-w-0 w-[360px] max-w-[360px] space-y-1 py-1">
          <p className="truncate text-sm font-semibold text-gray-900">{q.title}</p>
          <p className="line-clamp-1 text-xs text-blue-600">{q.subjectName}</p>
        </div>
      ),
    },
    {
      header: 'DẠNG CÂU HỎI',
      width: '210px',
      render: (q) => {
        const badge = questionTypeBadge[q.type] || questionTypeBadge.SINGLE_CHOICE
        return <AppBadge tone={badge.tone}>{badge.label}</AppBadge>
      },
    },
    {
      header: 'ĐỘ KHÓ',
      width: '100px',
      align: 'center',
      render: (q) => {
        const badge = difficultyBadge[q.difficulty] || difficultyBadge.EASY
        return <AppBadge tone={badge.tone}>{badge.label}</AppBadge>
      },
    },
    {
      header: 'PHẠM VI & DUYỆT',
      width: '170px',
      render: (q) => {
        if (q.archivedAt) {
          return <AppBadge tone="gray">Đã lưu trữ</AppBadge>
        }
        const status = q.reviewStatus || 'PRIVATE'
        if (status === 'APPROVED') {
          return <AppBadge tone="emerald">Ngân hàng chung</AppBadge>
        }
        if (status === 'PENDING_REVIEW') {
          return <AppBadge tone="amber">Chờ duyệt</AppBadge>
        }
        if (status === 'REJECTED') {
          return <AppBadge tone="rose">Bị từ chối</AppBadge>
        }
        if (status === 'REMOVED') {
          return <AppBadge tone="gray">Đã gỡ khỏi chung</AppBadge>
        }
        return <AppBadge tone="gray">Cá nhân</AppBadge>
      },
    },
    {
      header: 'THAO TÁC',
      width: activeTab === 'SHARED' ? '92px' : '132px',
      align: 'right',
      render: (q) => {
        const isArchived = Boolean(q.archivedAt)
        const canShareQuestion =
          activeTab === 'PERSONAL' && !isArchived && (!q.reviewStatus || q.reviewStatus === 'PRIVATE')

        return (
          <div className="flex items-center justify-end gap-1 text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(q)
              }}
              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Xem chi tiết câu hỏi"
            >
              <Eye size={16} />
            </button>

            {activeTab === 'SHARED' && canApproveSharedQuestions && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFromShared(q)
                }}
                className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Gỡ khỏi Ngân hàng chung"
              >
                <XCircle size={16} />
              </button>
            )}

            {activeTab === 'PERSONAL' && isArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore(q)
                }}
                className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Khôi phục câu hỏi"
              >
                <ArchiveRestore size={16} />
              </button>
            )}

            {activeTab === 'PERSONAL' && !isArchived && (
              <>
                {canShareQuestion && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onShare(q.id)
                    }}
                    className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Đóng góp vào Ngân hàng chung của Bộ môn"
                  >
                    <CloudUpload size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(q)
                  }}
                  className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa câu hỏi"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive(q)
                  }}
                  className="p-1.5 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Lưu trữ câu hỏi"
                >
                  <Archive size={16} />
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      embedded
      columns={columns}
      data={questions}
      keyExtractor={(q) => q.id}
      emptyText="Không tìm thấy câu hỏi nào phù hợp với bộ lọc."
    />
  )
}
