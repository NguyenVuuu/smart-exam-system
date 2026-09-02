import { LockKeyhole } from 'lucide-react'
import ConfirmDialog from '../../../../components/common/ConfirmDialog'

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
    <ConfirmDialog
      open
      title={locking ? 'Chốt lịch thi' : 'Mở lại lịch thi'}
      description={locking
        ? 'Sau khi chốt, đề không thể tạo hoặc gán thêm ca thi. Các ca đã tạo vẫn hoạt động bình thường.'
        : 'Đề sẽ được phép tạo thêm ca thi. Chỉ có thể mở lại khi chưa có sinh viên vào thi và chưa có ca bắt đầu.'}
      confirmLabel={locking ? 'Chốt lịch thi' : 'Mở lại lịch thi'}
      icon={<LockKeyhole size={19} className="text-blue-600" />}
      pending={saving}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
