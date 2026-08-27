import type { AdminSubject, AdminUser, Department } from '../../types/admin.types'
import { AdminField, AdminInput } from '../AdminFormFields'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'

export default function DepartmentSubjectFormModal({
  open,
  tab,
  editingDepartmentId,
  editingSubjectId,
  departments,
  teacherCandidates,
  departmentNameInput,
  onDepartmentNameChange,
  departmentHeadInput,
  onDepartmentHeadChange,
  subjectCodeInput,
  onSubjectCodeChange,
  subjectNameInput,
  onSubjectNameChange,
  subjectDepartmentInput,
  onSubjectDepartmentChange,
  subjectCreditsInput,
  onSubjectCreditsChange,
  subjectStatusInput,
  onSubjectStatusChange,
  onClose,
  onConfirm,
}: {
  open: boolean
  tab: 'DEPARTMENTS' | 'SUBJECTS'
  editingDepartmentId: string | null
  editingSubjectId: string | null
  departments: Department[]
  teacherCandidates: AdminUser[]
  departmentNameInput: string
  onDepartmentNameChange: (val: string) => void
  departmentHeadInput: string
  onDepartmentHeadChange: (val: string) => void
  subjectCodeInput: string
  onSubjectCodeChange: (val: string) => void
  subjectNameInput: string
  onSubjectNameChange: (val: string) => void
  subjectDepartmentInput: string
  onSubjectDepartmentChange: (val: string) => void
  subjectCreditsInput: string
  onSubjectCreditsChange: (val: string) => void
  subjectStatusInput: AdminSubject['status']
  onSubjectStatusChange: (val: AdminSubject['status']) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const modalTitle =
    tab === 'DEPARTMENTS'
      ? editingDepartmentId
        ? 'Cập nhật bộ môn'
        : 'Thêm bộ môn mới'
      : editingSubjectId
      ? 'Cập nhật môn học'
      : 'Thêm môn học mới'

  const modalDescription =
    tab === 'DEPARTMENTS'
      ? 'Bộ môn là phạm vi chuyên môn để quản lý môn học và bổ nhiệm Trưởng bộ môn.'
      : 'Môn học là đơn vị để mở các lớp học phần trong từng học kỳ.'

  const modalConfirmText =
    tab === 'DEPARTMENTS'
      ? editingDepartmentId
        ? 'Cập nhật bộ môn'
        : 'Tạo bộ môn'
      : editingSubjectId
      ? 'Cập nhật môn học'
      : 'Tạo môn học'

  return (
    <AdminModal
      open={open}
      title={modalTitle}
      description={modalDescription}
      confirmText={modalConfirmText}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="space-y-4">
        {tab === 'DEPARTMENTS' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Tên bộ môn">
              <AdminInput
                value={departmentNameInput}
                onChange={(event) => onDepartmentNameChange(event.target.value)}
                placeholder="VD: Bộ môn Công nghệ phần mềm"
              />
            </AdminField>
            <AdminField label="Trưởng bộ môn">
              <AdminSelect
                value={departmentHeadInput}
                onChange={onDepartmentHeadChange}
                options={[
                  { value: 'NONE', label: 'Chưa bổ nhiệm' },
                  ...teacherCandidates.map((teacher) => ({
                    value: teacher.id,
                    label: `${teacher.fullName} - ${teacher.code}`,
                  })),
                ]}
              />
            </AdminField>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AdminField label="Mã môn học">
                <AdminInput
                  value={subjectCodeInput}
                  onChange={(event) => onSubjectCodeChange(event.target.value)}
                  placeholder="VD: CS101"
                />
              </AdminField>
              <AdminField label="Số tín chỉ">
                <AdminInput
                  type="number"
                  min={1}
                  value={subjectCreditsInput}
                  onChange={(event) => onSubjectCreditsChange(event.target.value)}
                  placeholder="3"
                />
              </AdminField>
            </div>
            <AdminField label="Tên môn học">
              <AdminInput
                value={subjectNameInput}
                onChange={(event) => onSubjectNameChange(event.target.value)}
                placeholder="VD: Lập trình Java"
              />
            </AdminField>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AdminField label="Bộ môn phụ trách">
                <AdminSelect
                  value={subjectDepartmentInput}
                  onChange={onSubjectDepartmentChange}
                  options={departments.map((department) => ({
                    value: department.id,
                    label: department.name,
                  }))}
                />
              </AdminField>
              <AdminField label="Trạng thái">
                <AdminSelect
                  value={subjectStatusInput}
                  onChange={(value) => onSubjectStatusChange(value as AdminSubject['status'])}
                  options={[
                    { value: 'ACTIVE', label: 'Đang sử dụng' },
                    { value: 'INACTIVE', label: 'Tạm ngưng' },
                  ]}
                />
              </AdminField>
            </div>
          </>
        )}
      </div>
    </AdminModal>
  )
}
