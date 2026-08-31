import { CalendarPlus, Eye } from 'lucide-react'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { AdminExam } from '../../types/admin.types'
import { ExamCategoryBadge, ExamStatusBadge } from '../AdminBadges'

const structureLabel: Record<AdminExam['structure'], string> = {
  OBJECTIVE: 'Trắc nghiệm',
  PROGRAMMING: 'Lập trình',
  MIXED: 'Hỗn hợp',
}

const canCreateCentralSchedule = (exam: AdminExam) => exam.category === 'FINAL' && exam.status === 'APPROVED'

export default function ExamTrackingTable({
  exams,
  onViewExam,
  onCreateSchedule,
  page,
  pageSize = 10,
  totalItems,
  totalPages,
  onPageChange,
}: {
  exams: AdminExam[]
  onViewExam: (exam: AdminExam) => void
  onCreateSchedule: (exam: AdminExam) => void
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}) {
  const columns: ColumnDef<AdminExam>[] = [
    {
      header: 'ĐỀ THI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          <p className="text-xs text-slate-400">
            {item.subjectName} • Giảng viên soạn: {item.authorName}
          </p>
        </div>
      ),
    },
    {
      header: 'LOẠI',
      width: '240px',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <ExamCategoryBadge category={item.category} />
          <span className="text-xs font-normal text-slate-400">{structureLabel[item.structure]}</span>
        </div>
      ),
    },
    {
      header: 'ĐIỂM / CÂU',
      width: '150px',
      render: (item) => (
        <span className="text-sm text-slate-700">
          {item.totalPoints} điểm • {item.questionCount} câu
        </span>
      ),
    },
    {
      header: 'THỜI GIAN',
      width: '120px',
      render: (item) => <span className="text-sm text-slate-700">{item.durationMinutes} phút</span>,
    },
    {
      header: 'TRẠNG THÁI',
      width: '160px',
      render: (item) => <ExamStatusBadge status={item.status} category={item.category} />,
    },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Xem chi tiết đề thi"
            onClick={() => onViewExam(item)}
          >
            <Eye size={17} />
          </button>
          {canCreateCentralSchedule(item) && (
            <button
              className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600"
              title="Tạo lịch thi tập trung"
              onClick={() => onCreateSchedule(item)}
            >
              <CalendarPlus size={17} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={exams}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có đề thi phù hợp."
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  )
}
