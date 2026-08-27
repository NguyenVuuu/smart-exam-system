import { ScrollText } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_AUDIT_LOGS } from './mock/admin.mock'
import type { AuditLogItem } from './types/admin.types'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

export default function AdminAuditLogPage() {
  const [action, setAction] = useState('ALL')
  const [search, setSearch] = useState('')

  const filteredLogs = ADMIN_AUDIT_LOGS.filter((item) => {
    const matchesAction = action === 'ALL' || item.action === action
    const matchesSearch =
      item.actor.toLowerCase().includes(search.toLowerCase()) ||
      item.entity.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase())
    return matchesAction && matchesSearch
  })

  const columns: ColumnDef<AuditLogItem>[] = [
    { header: 'THỜI GIAN', width: '180px', render: (item) => <span className="text-sm text-slate-700">{item.time}</span> },
    {
      header: 'NGƯỜI THỰC HIỆN',
      width: '210px',
      render: (item) => (
        <div>
          <p className="text-sm font-semibold text-slate-950">{item.actor}</p>
          <p className="text-xs text-slate-400">10.10.5.12</p>
        </div>
      ),
    },
    { header: 'HÀNH ĐỘNG', width: '180px', render: (item) => <AppBadge tone={item.action === 'SỬA ĐIỂM' ? 'amber' : item.action === 'TẠO CA THI' ? 'blue' : 'emerald'}>{item.action}</AppBadge> },
    { header: 'THỰC THỂ', width: '240px', render: (item) => <span className="text-sm text-slate-700">{item.entity}</span> },
    { header: 'CHI TIẾT', render: (item) => <span className="text-sm text-slate-600">{item.detail}</span> },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<ScrollText size={20} />}
        title="Audit Log"
        description="Ghi lại các thao tác quan trọng: đăng nhập, duyệt, sửa điểm, hủy ca và xử lý vi phạm."
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo người thực hiện, thực thể hoặc chi tiết..."
          onReset={() => {
            setSearch('')
            setAction('ALL')
          }}
          filters={(
            <AdminSelect value={action} onChange={setAction} className="w-56" options={[
              { value: 'ALL', label: 'Hành động' },
              { value: 'SỬA ĐIỂM', label: 'Sửa điểm' },
              { value: 'TẠO CA THI', label: 'Tạo ca thi' },
              { value: 'ĐĂNG NHẬP', label: 'Đăng nhập' },
            ]} />
          )}
        />
        <DataTable columns={columns} data={filteredLogs} keyExtractor={(item) => item.id} emptyText="Chưa có audit log phù hợp." />
      </AdminTablePanel>
    </AdminLayout>
  )
}
