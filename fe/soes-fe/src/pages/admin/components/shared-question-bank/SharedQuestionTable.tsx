import { Archive, ArchiveRestore, Eye } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { AdminSubject, SharedQuestionAdmin } from '../../types/admin.types'
import { QuestionStatusBadge } from '../AdminBadges'

const typeLabel: Record<SharedQuestionAdmin['type'], string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

const difficultyTone = {
  EASY: 'emerald',
  MEDIUM: 'amber',
  HARD: 'rose',
} as const

const difficultyLabel: Record<SharedQuestionAdmin['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

export default function SharedQuestionTable({
  items,
  subjectsByCode,
  onView,
  onRemove,
  onRestore,
  page,
  pageSize = 10,
  totalItems,
  totalPages,
  onPageChange,
}: {
  items: SharedQuestionAdmin[]
  subjectsByCode: Map<string, AdminSubject>
  onView: (item: SharedQuestionAdmin) => void
  onRemove: (item: SharedQuestionAdmin) => void
  onRestore: (item: SharedQuestionAdmin) => void
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}) {
  const columns: ColumnDef<SharedQuestionAdmin>[] = [
    {
      header: 'CÂU HỎI',
      render: (item) => (
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">{item.content}</p>
          <p className="text-xs text-slate-400">
            {subjectsByCode.get(item.subjectCode)?.name ?? item.subjectCode} • Đóng góp bởi: {item.contributorName}
          </p>
        </div>
      ),
    },
    {
      header: 'DẠNG CÂU',
      width: '160px',
      render: (item) => <span className="text-sm text-slate-700">{typeLabel[item.type]}</span>,
    },
    {
      header: 'ĐỘ KHÓ',
      width: '120px',
      render: (item) => (
        <AppBadge tone={difficultyTone[item.difficulty]}>{difficultyLabel[item.difficulty]}</AppBadge>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      width: '160px',
      render: (item) => <QuestionStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Xem chi tiết câu hỏi"
            onClick={() => onView(item)}
          >
            <Eye size={17} />
          </button>
          {item.status === 'APPROVED' ? (
            <button
              className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"
              title="Gỡ khỏi ngân hàng chung"
              onClick={() => onRemove(item)}
            >
              <Archive size={17} />
            </button>
          ) : (
            <button
              className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600"
              title="Khôi phục vào ngân hàng chung"
              onClick={() => onRestore(item)}
            >
              <ArchiveRestore size={17} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có câu hỏi phù hợp."
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  )
}
