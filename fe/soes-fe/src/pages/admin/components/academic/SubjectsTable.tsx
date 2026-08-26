import { Archive, Edit } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { AdminSubject, Department } from '../../types/admin.types'
import { AdminStatusBadge } from '../AdminBadges'

export default function SubjectsTable({
  subjects,
  departmentsById,
  onEditSubject,
  onArchiveSubject,
}: {
  subjects: AdminSubject[]
  departmentsById: Map<string, Department>
  onEditSubject: (subj: AdminSubject) => void
  onArchiveSubject: (subj: AdminSubject) => void
}) {
  const subjectColumns: ColumnDef<AdminSubject>[] = [
    {
      header: 'MÃ MÔN',
      width: '120px',
      render: (item) => <span className="text-sm font-semibold text-slate-950">{item.code}</span>,
    },
    {
      header: 'TÊN MÔN HỌC',
      render: (item) => <span className="text-sm text-slate-800">{item.name}</span>,
    },
    {
      header: 'BỘ MÔN',
      width: '260px',
      render: (item) => (
        <span className="text-sm text-slate-700">{departmentsById.get(item.departmentId)?.name}</span>
      ),
    },
    {
      header: 'TÍN CHỈ',
      width: '90px',
      align: 'center',
      render: (item) => <span className="text-sm font-semibold text-slate-800">{item.credits}</span>,
    },
    {
      header: 'SỐ LỚP',
      width: '100px',
      render: (item) => <AppBadge tone="emerald">{item.courseCount} lớp</AppBadge>,
    },
    {
      header: 'TRẠNG THÁI',
      width: '150px',
      render: (item) => <AdminStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => onEditSubject(item)}
          >
            <Edit size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700"
            title="Lưu trữ"
            onClick={() => onArchiveSubject(item)}
          >
            <Archive size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={subjectColumns}
      data={subjects}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có môn học phù hợp."
    />
  )
}
