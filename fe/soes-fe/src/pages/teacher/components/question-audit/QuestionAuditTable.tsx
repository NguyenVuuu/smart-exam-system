import { AlertCircle, Edit } from 'lucide-react'
import { useMemo } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { QuestionAuditItemDto } from '../../types/teacher-question-api.types'

interface QuestionAuditTableProps {
  items: QuestionAuditItemDto[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  loading: boolean
  error: boolean
  onPageChange: (page: number) => void
  onEdit: (question: QuestionAuditItemDto) => void
  onRetry: () => void
}

const severityTone = { HIGH: 'rose', LOW: 'amber' } as const
const severityLabel = { HIGH: 'Cần sửa', LOW: 'Cần lưu ý' } as const

export default function QuestionAuditTable({
  items,
  page,
  pageSize,
  totalItems,
  totalPages,
  loading,
  error,
  onPageChange,
  onEdit,
  onRetry,
}: QuestionAuditTableProps) {
  const columns = useMemo<ColumnDef<QuestionAuditItemDto>[]>(() => [
    {
      header: 'Tiêu đề câu hỏi',
      render: (auditItem) => (
        <div className="max-w-3xl space-y-2 py-1">
          <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-gray-900">
            {auditItem.question.title}
          </p>
          <ul className="space-y-1">
            {auditItem.issues.map((issue) => (
              <li
                key={issue.code}
                className={`flex items-start gap-1.5 text-xs font-medium ${
                  issue.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
                }`}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      header: 'Môn học',
      width: '220px',
      render: ({ question }) => <span className="text-sm text-gray-700">{question.subject.name}</span>,
    },
    {
      header: 'Mức độ',
      width: '170px',
      align: 'center',
      render: (auditItem) => (
        <AppBadge
          tone={severityTone[auditItem.severity]}
          shape="rounded"
          className="whitespace-nowrap font-semibold"
        >
          {severityLabel[auditItem.severity]} ({auditItem.issues.length})
        </AppBadge>
      ),
    },
    {
      header: 'Thao tác',
      width: '100px',
      align: 'right',
      render: (auditItem) => (
        <button
          type="button"
          onClick={() => onEdit(auditItem)}
          title="Sửa câu hỏi này"
          aria-label={`Sửa câu hỏi ${auditItem.question.title}`}
          className="inline-flex rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Edit size={16} />
        </button>
      ),
    },
  ], [onEdit])

  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 px-4 py-12 text-sm text-rose-700">
        <span>Không thể tải kết quả rà soát.</span>
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <DataTable
      embedded
      columns={columns}
      data={items}
      keyExtractor={({ question }) => question.id}
      isLoading={loading}
      emptyText="Ngân hàng câu hỏi cá nhân không có vấn đề kỹ thuật nào."
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  )
}
