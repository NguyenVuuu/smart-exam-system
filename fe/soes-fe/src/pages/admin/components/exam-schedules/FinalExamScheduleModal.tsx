import type { AdminExam, AdminExamSchedule } from '../../types/admin.types'
import AdminModal from '../AdminModal'
import FinalExamScheduleForm from './FinalExamScheduleForm'

interface FinalExamScheduleModalProps {
  open: boolean
  exams: AdminExam[]
  schedules: AdminExamSchedule[]
  editingSchedule?: AdminExamSchedule | null
  onClose: () => void
  onSubmit: (schedule: AdminExamSchedule) => void
}

export default function FinalExamScheduleModal({
  open,
  exams,
  schedules,
  editingSchedule = null,
  onClose,
  onSubmit,
}: FinalExamScheduleModalProps) {
  if (!open) return null

  return (
    <AdminModal
      open={open}
      size="xl"
      title={editingSchedule ? 'Sửa lịch thi cuối kỳ tập trung' : 'Tạo lịch thi cuối kỳ tập trung'}
      description="Chọn đề đã duyệt, lớp áp dụng và phân công giảng viên coi thi riêng cho từng lớp."
      confirmText={editingSchedule ? 'Lưu thay đổi' : 'Tạo lịch thi'}
      onClose={onClose}
      onConfirm={() => {
        const form = document.getElementById('final-exam-schedule-form') as HTMLFormElement | null
        form?.requestSubmit()
      }}
    >
      <FinalExamScheduleForm
        key={editingSchedule?.id ?? 'new-schedule'}
        exams={exams}
        schedules={schedules}
        editingSchedule={editingSchedule}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminModal>
  )
}
