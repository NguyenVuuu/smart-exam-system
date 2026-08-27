import { Crown, Edit } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { Department } from '../../types/admin.types'

export default function DepartmentsTable({
  departments,
  onOpenHeadModal,
  onEditDepartment,
}: {
  departments: Department[]
  onOpenHeadModal: (dept: Department) => void
  onEditDepartment: (dept: Department) => void
}) {
  const departmentColumns: ColumnDef<Department>[] = [
    {
      header: 'TÊN BỘ MÔN',
      render: (item) => <span className="text-sm font-semibold text-slate-950">{item.name}</span>,
    },
    {
      header: 'TRƯỞNG BỘ MÔN',
      width: '260px',
      render: (item) =>
        item.headName ? (
          <div>
            <p className="text-sm font-semibold text-slate-800">{item.headName}</p>
            <p className="text-xs text-slate-400">{item.headCode}</p>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Chưa bổ nhiệm</span>
        ),
    },
    {
      header: 'MÔN HỌC',
      width: '130px',
      render: (item) => (
        <AppBadge tone={item.subjectCount > 0 ? 'emerald' : 'gray'}>{item.subjectCount} môn</AppBadge>
      ),
    },
    {
      header: 'THAO TÁC',
      width: '130px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className={`rounded-lg p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-500 ${
              item.headName ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
            }`}
            title={item.headName ? 'Đổi Trưởng bộ môn' : 'Bổ nhiệm Trưởng bộ môn'}
            onClick={() => onOpenHeadModal(item)}
          >
            <Crown size={17} fill="none" />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => onEditDepartment(item)}
          >
            <Edit size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={departmentColumns}
      data={departments}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có bộ môn phù hợp."
    />
  )
}
