import { LockKeyhole, X } from 'lucide-react'

export default function ExamDistributionLockDialog({
  action,
  saving,
  onClose,
  onConfirm,
}: {
  action: 'LOCK' | 'UNLOCK' | null
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!action) return null
  const locking = action === 'LOCK'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <LockKeyhole size={19} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-950">
              {locking ? 'Chốt lịch thi' : 'Mở lại lịch thi'}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-gray-100" title="Đóng">
            <X size={18} />
          </button>
        </div>
        <p className="px-6 py-5 text-sm leading-6 text-slate-600">
          {locking
            ? 'Sau khi chốt, đề không thể tạo hoặc gán thêm ca thi. Các ca đã tạo vẫn hoạt động bình thường.'
            : 'Đề sẽ được phép tạo thêm ca thi. Chỉ có thể mở lại khi chưa có sinh viên vào thi và chưa có ca bắt đầu.'}
        </p>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium disabled:opacity-50">Hủy</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Đang xử lý...' : locking ? 'Chốt lịch thi' : 'Mở lại lịch thi'}
          </button>
        </div>
      </div>
    </div>
  )
}
