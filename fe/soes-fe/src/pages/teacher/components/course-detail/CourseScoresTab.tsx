import { FileSpreadsheet } from 'lucide-react'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { CourseGradebookApiDto } from '../../types/teacher-course-api.types'

type GradeRow = CourseGradebookApiDto['students'][number]

export default function CourseScoresTab({
  gradebook,
  onPageChange,
}: {
  gradebook: CourseGradebookApiDto
  onPageChange: (page: number) => void
}) {
  const columns: ColumnDef<GradeRow>[] = [
    { header: 'MSSV', width: '140px', render: (row) => <span className="font-medium">{row.studentCode}</span> },
    { header: 'Họ và tên', width: '220px', render: (row) => <span className="font-semibold text-gray-900">{row.fullName}</span> },
    ...gradebook.assessments.map<ColumnDef<GradeRow>>((assessment) => ({
      header: <span title={assessment.title} className="block max-w-48 truncate normal-case">{assessment.title} ({assessment.totalPoints}đ)</span>,
      width: '190px',
      align: 'center',
      render: (row) => {
        const score = row.scores[assessment.scheduleId]
        return <span className={assessment.resultsPublished ? 'text-gray-800' : 'text-gray-500'}>{score ?? '-'}</span>
      },
    })),
    {
      header: 'Trung bình (thang 10)', width: '170px', align: 'center',
      render: (row) => <span className="font-semibold text-gray-900">{row.averageScore ?? '-'}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Bảng điểm lớp học phần</h3>
          <p className="mt-1 text-sm text-gray-500">Điểm được lấy từ bài nộp thật của từng ca thi.</p>
        </div>
        <button disabled title="Tính năng xuất Excel sẽ được nối sau" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          <FileSpreadsheet size={18} /> Xuất Excel
        </button>
      </div>
      <DataTable
        columns={columns}
        data={gradebook.students}
        keyExtractor={(row) => row.studentId}
        emptyText="Chưa có dữ liệu điểm trong lớp học phần"
        page={gradebook.pagination.page}
        totalItems={gradebook.pagination.totalItems}
        totalPages={gradebook.pagination.totalPages}
        pageSize={gradebook.pagination.pageSize}
        onPageChange={onPageChange}
      />
    </div>
  )
}
