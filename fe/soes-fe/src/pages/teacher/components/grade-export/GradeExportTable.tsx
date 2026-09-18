import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import { formatDateTime } from '../../../../utils/date.utils'

export interface StudentGradeRow {
  id: string
  studentCode: string
  studentName: string
  classCode: string
  submittedAt: string | null
  totalScore: number
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: string
}

const letterGradeTone: Record<string, 'emerald' | 'blue' | 'amber' | 'rose'> = {
  A: 'emerald',
  B: 'blue',
  C: 'amber',
  D: 'rose',
  F: 'rose',
}

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Đã nộp',
  AUTO_SUBMITTED: 'Tự động nộp',
  GRADING: 'Đang chấm',
  GRADED: 'Đã chấm',
  PUBLISHED: 'Đã công bố',
  INVALIDATED: 'Đã hủy',
}

const columns: ColumnDef<StudentGradeRow>[] = [
  {
    header: 'MSSV',
    accessorKey: 'studentCode',
    width: '130px',
    className: 'whitespace-nowrap font-medium text-blue-700',
  },
  {
    header: 'Họ và tên',
    accessorKey: 'studentName',
    width: '220px',
    className: 'whitespace-nowrap font-medium text-gray-900',
  },
  {
    header: 'Mã lớp HP',
    accessorKey: 'classCode',
    width: '150px',
    className: 'whitespace-nowrap text-gray-600',
  },
  {
    header: 'Thời gian nộp',
    render: (row) => formatDateTime(row.submittedAt),
    width: '175px',
    className: 'whitespace-nowrap text-gray-500 text-xs',
  },
  {
    header: 'Điểm hệ 10',
    width: '120px',
    align: 'center',
    render: (row) => (
      <span className="font-bold text-gray-900">
        {row.totalScore.toFixed(2)}
      </span>
    ),
  },
  {
    header: 'Điểm chữ',
    width: '105px',
    align: 'center',
    render: (row) => (
      <AppBadge tone={letterGradeTone[row.letterGrade] || 'blue'}>
        {row.letterGrade}
      </AppBadge>
    ),
  },
  {
    header: 'Trạng thái',
    width: '130px',
    className: 'whitespace-nowrap',
    render: (row) => (
      <span className="text-xs text-gray-600">
        {statusLabel[row.status] || row.status}
      </span>
    ),
  },
]

export interface GradeExportTableProps {
  rows: StudentGradeRow[]
  loading: boolean
}

export default function GradeExportTable({ rows, loading }: GradeExportTableProps) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      keyExtractor={(item) => item.id}
      isLoading={loading}
      emptyText="Không tìm thấy sinh viên nào trong danh sách."
      embedded
    />
  )
}
