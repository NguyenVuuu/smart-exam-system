import { AlertTriangle, X } from 'lucide-react'
import type { AdminUser } from '../../types/admin.types'
import AdminButton from '../AdminButton'

export default function RemoveDepartmentHeadDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!user) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Gỡ trưởng bộ môn</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle size={23} />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Gỡ chức danh trưởng bộ môn của {user.fullName}?
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton tone="danger" onClick={onConfirm}>
            Xác nhận
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
