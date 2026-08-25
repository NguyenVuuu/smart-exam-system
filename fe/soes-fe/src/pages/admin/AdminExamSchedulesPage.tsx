import { CalendarClock, Edit, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_EXAM_SCHEDULES } from './mock/admin.mock'
import type { AdminExamSchedule } from './types/admin.types'
import { AdminStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

export default function AdminExamSchedulesPage() {
  const [items, setItems] = useState<AdminExamSchedule[]>(ADMIN_EXAM_SCHEDULES)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filteredItems = items.filter((item) =>
    item.examTitle.toLowerCase().includes(search.toLowerCase()) ||
    item.courseCodes.join(' ').toLowerCase().includes(search.toLowerCase()) ||
    item.proctors.join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ColumnDef<AdminExamSchedule>[] = [
    {
      header: 'CA THI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.examTitle}</p>
          <p className="text-xs text-slate-400">{item.date} • {item.time}</p>
        </div>
      ),
    },
    { header: 'LỚP ÁP DỤNG', width: '250px', render: (item) => <span className="text-sm text-slate-700">{item.courseCodes.join(', ')}</span> },
    { header: 'ĐỊA ĐIỂM / IP', width: '220px', render: (item) => <span className="text-sm text-slate-700">{item.location} • {item.ipPolicy}</span> },
    { header: 'GIÁM THỊ', width: '220px', render: (item) => <span className="text-sm text-slate-700">{item.proctors.join(', ')}</span> },
    { header: 'TRẠNG THÁI', width: '150px', render: (item) => <AdminStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button disabled={item.status === 'CLOSED'} className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30" title="Sửa ca thi"><Edit size={17} /></button>
          <button
            disabled={item.status === 'CLOSED'}
            className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
            title="Hủy ca thi"
            onClick={() => setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'CANCELLED' } : row))}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<CalendarClock size={20} />}
        title="Lịch thi và Phân công"
        description="Tạo ca thi tập trung từ đề đã duyệt, gán lớp, địa điểm/IP tùy chọn và phân công giảng viên giám sát."
        action={<AdminButton icon={<Plus size={17} />} onClick={() => setModalOpen(true)}>Tạo lịch thi</AdminButton>}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <AdminTablePanel>
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-slate-950">Các ca thi tập trung</h2>
            <p className="mt-1 text-[13px] text-slate-500">Danh sách lịch thi cuối kỳ/giữa kỳ đang được tổ chức.</p>
          </div>
          <AdminToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm ca thi, lớp hoặc giám thị..." onReset={() => setSearch('')} />
          <DataTable columns={columns} data={filteredItems} keyExtractor={(item) => item.id} emptyText="Chưa có lịch thi phù hợp." />
        </AdminTablePanel>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">Đề đã duyệt sẵn sàng</h2>
          <p className="mt-1 text-[13px] text-slate-500">Chỉ đề được Trưởng bộ môn duyệt mới dùng để tạo lịch thi tập trung.</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Bài thi Giữa kỳ Lập trình Java</p>
                <p className="text-xs text-slate-400">Lập trình Java • 10 điểm</p>
              </div>
              <AppBadge tone="emerald">Đã duyệt</AppBadge>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Bài thi Cuối kỳ Cơ sở dữ liệu</p>
                <p className="text-xs text-slate-400">Cơ sở dữ liệu • 10 điểm</p>
              </div>
              <AppBadge tone="emerald">Đã duyệt</AppBadge>
            </div>
          </div>
        </section>
      </div>

      <AdminModal
        open={modalOpen}
        title="Tạo lịch thi tập trung"
        description="Chọn đề đã duyệt, gán lớp và phân công giảng viên giám sát. Phòng/IP là tùy chọn, không quản lý thành module riêng."
        confirmText="Tạo lịch thi"
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false)
          alert('Đã tạo lịch thi mẫu.')
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Đề thi đã duyệt"><AdminInput placeholder="Chọn đề..." /></AdminField>
          <AdminField label="Địa điểm / IP tùy chọn"><AdminInput placeholder="VD: Online hoặc 10.10.0.0/16" /></AdminField>
          <AdminField label="Ngày thi"><AdminInput type="date" /></AdminField>
          <AdminField label="Giờ mở"><AdminInput type="time" defaultValue="08:00" /></AdminField>
          <AdminField label="Giờ đóng"><AdminInput type="time" defaultValue="09:00" /></AdminField>
          <AdminField label="Lớp áp dụng"><AdminInput placeholder="JAVA_01_HK1_2026, JAVA_02_HK1_2026" /></AdminField>
          <AdminField label="Giảng viên coi thi"><AdminInput placeholder="Nguyễn Văn An, Trần Thị Lan" /></AdminField>
        </div>
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Hệ thống sẽ kiểm tra trùng lịch lớp, trùng giảng viên coi thi và IP trước khi lưu.
        </div>
      </AdminModal>
    </AdminLayout>
  )
}
