import { Edit, Lock, Unlock, Users } from 'lucide-react'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { CourseOfferingAdmin } from '../../types/admin.types'
import { AdminStatusBadge } from '../AdminBadges'

export default function ClassSectionsTable({
  items,
  onOpenEnrollment,
  onOpenEdit,
  onToggleStatus,
}: {
  items: CourseOfferingAdmin[]
  onOpenEnrollment: (item: CourseOfferingAdmin) => void
  onOpenEdit: (item: CourseOfferingAdmin) => void
  onToggleStatus: (item: CourseOfferingAdmin) => void
}) {
  const columns: ColumnDef<CourseOfferingAdmin>[] = [
    {
      header: 'MÃ LỚP',
      width: '190px',
      render: (item) => <span className="text-sm font-semibold text-slate-950">{item.code}</span>,
    },
    {
      header: 'MÔN HỌC',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{item.subjectName}</p>
          <p className="text-xs text-slate-400">{item.subjectCode}</p>
        </div>
      ),
    },
    {
      header: 'HỌC KỲ',
      width: '130px',
      render: (item) => <span className="text-sm text-slate-700">{item.semesterCode}</span>,
    },
    {
      header: 'GIẢNG VIÊN',
      width: '210px',
      render: (item) => <span className="text-sm text-slate-700">{item.teacherName}</span>,
    },
    {
      header: 'SĨ SỐ',
      width: '170px',
      render: (item) => {
        const percent = Math.min(100, Math.round((item.enrolled / item.capacity) * 100))
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>
                {item.enrolled}/{item.capacity}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      },
    },
    {
      header: 'TRẠNG THÁI',
      width: '140px',
      render: (item) => <AdminStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600"
            title="Xếp lớp sinh viên"
            onClick={() => onOpenEnrollment(item)}
          >
            <Users size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => onOpenEdit(item)}
          >
            <Edit size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700"
            title={item.status === 'OPEN' ? 'Đóng lớp' : 'Mở lại lớp'}
            onClick={() => onToggleStatus(item)}
          >
            {item.status === 'OPEN' ? <Lock size={17} /> : <Unlock size={17} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có lớp học phần phù hợp."
    />
  )
}
