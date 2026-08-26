import { X } from 'lucide-react'
import AdminButton from '../AdminButton'
import { AdminTextarea } from '../AdminFormFields'

export default function UserImportModal({
  open,
  value,
  onChange,
  onClose,
  onConfirm,
}: {
  open: boolean
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Nhập danh sách sinh viên</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Mỗi dòng: MSSV, Họ tên, Email. Hệ thống kiểm tra định dạng và email trùng trước khi thêm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <AdminTextarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-40"
            placeholder="SV2026007, Nguyễn Văn Hùng, hung.nv@soes.edu.vn"
          />
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Đóng
          </AdminButton>
          <AdminButton onClick={onConfirm}>Kiểm tra danh sách</AdminButton>
        </div>
      </div>
    </div>
  )
}
