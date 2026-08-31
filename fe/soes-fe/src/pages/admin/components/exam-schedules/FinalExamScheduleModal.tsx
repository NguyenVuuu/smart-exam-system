import type { AdminExam, AdminExamSchedule } from '../../types/admin.types'
import AdminModal from '../AdminModal'
import FinalExamScheduleForm from './FinalExamScheduleForm'
import type { AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../../types/admin.types'

interface FinalExamScheduleModalProps {
  open: boolean
  exams: AdminExam[]
  schedules: AdminExamSchedule[]
  departments: Department[]
  subjects: AdminSubject[]
  courses: CourseOfferingAdmin[]
  users: AdminUser[]
  editingSchedule?: AdminExamSchedule | null
  onClose: () => void
  onSubmit: (schedule: AdminExamSchedule) => void | Promise<void>
}

export default function FinalExamScheduleModal({
  open,
  exams,
  schedules,
  departments,
  subjects,
  courses,
  users,
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
        departments={departments}
        subjects={subjects}
        courses={courses}
        users={users}
        editingSchedule={editingSchedule}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminModal>
  )
}
