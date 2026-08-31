import type { AcademicYear, AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../../types/admin.types'
import { AdminField, AdminInput } from '../AdminFormFields'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'

export default function ClassSectionFormModal({
  open,
  editingClassId,
  departmentInput,
  onDepartmentChange,
  subjectCodeInput,
  onSubjectCodeChange,
  selectedDepartmentSubjects,
  semesterCodeInput,
  onSemesterCodeChange,
  classCodeInput,
  onClassCodeChange,
  capacityInput,
  onCapacityChange,
  teacherIdInput,
  onTeacherIdChange,
  teacherOptions,
  departments,
  semesters,
  classStatusInput,
  onClassStatusChange,
  onClose,
  onConfirm,
}: {
  open: boolean
  editingClassId: string | null
  departmentInput: string
  onDepartmentChange: (val: string) => void
  subjectCodeInput: string
  onSubjectCodeChange: (val: string) => void
  selectedDepartmentSubjects: AdminSubject[]
  semesterCodeInput: string
  onSemesterCodeChange: (val: string) => void
  classCodeInput: string
  onClassCodeChange: (val: string) => void
  capacityInput: string
  onCapacityChange: (val: string) => void
  teacherIdInput: string
  onTeacherIdChange: (val: string) => void
  teacherOptions: AdminUser[]
  departments: Department[]
  semesters: AcademicYear[]
  classStatusInput: CourseOfferingAdmin['status']
  onClassStatusChange: (val: CourseOfferingAdmin['status']) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <AdminModal
      open={open}
      title={editingClassId ? 'Cập nhật lớp học phần' : 'Thêm lớp học phần mới'}
      description="Lớp học phần gắn một môn học với giảng viên phụ trách trong một học kỳ."
      confirmText={editingClassId ? 'Cập nhật lớp học phần' : 'Tạo lớp học phần'}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AdminField label="Bộ môn">
          <AdminSelect
            value={departmentInput}
            onChange={onDepartmentChange}
            options={departments.map((department) => ({ value: department.id, label: department.name }))}
          />
        </AdminField>
        <AdminField label="Môn học">
          <AdminSelect
            value={subjectCodeInput}
            onChange={onSubjectCodeChange}
            options={selectedDepartmentSubjects.map((item) => ({
              value: item.id,
              label: `${item.code} - ${item.name}`,
            }))}
          />
        </AdminField>
        <AdminField label="Học kỳ">
          <AdminSelect
            value={semesterCodeInput}
            onChange={onSemesterCodeChange}
            options={semesters.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
          />
        </AdminField>
        <AdminField label="Mã lớp học phần">
          <AdminInput
            value={classCodeInput}
            onChange={(event) => onClassCodeChange(event.target.value)}
            placeholder="VD: JAVA_01_HK1_2026"
          />
        </AdminField>
        <AdminField label="Sức chứa">
          <AdminInput
            type="number"
            min={1}
            value={capacityInput}
            onChange={(event) => onCapacityChange(event.target.value)}
            placeholder="60"
          />
        </AdminField>
        <AdminField label="Giảng viên phụ trách">
          <AdminSelect
            value={teacherIdInput}
            onChange={onTeacherIdChange}
            options={teacherOptions.map((teacher) => ({
              value: teacher.id,
              label: `${teacher.fullName} - ${teacher.code}`,
            }))}
          />
        </AdminField>
        <AdminField label="Trạng thái">
          <AdminSelect
            value={classStatusInput}
            onChange={(value) => onClassStatusChange(value as CourseOfferingAdmin['status'])}
            options={[
              { value: 'OPEN', label: 'Đang mở' },
              { value: 'CLOSED', label: 'Đã đóng' },
            ]}
          />
        </AdminField>
      </div>
      <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Hệ thống sẽ kiểm tra trùng mã lớp và không cho sĩ số vượt sức chứa.
      </div>
    </AdminModal>
  )
}
