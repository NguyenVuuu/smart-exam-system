import { useEffect, useRef } from 'react'
import { useAuthStore } from '../../../../store/authStore'
import type { AdminUser, Department } from '../../types/admin.types'
import { getNextUserCode } from '../../api/admin-management.api'
import { AdminField, AdminInput } from '../AdminFormFields'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'
import StudentFaceEnrollmentSection from './StudentFaceEnrollmentSection'

export default function UserFormModal({
  open,
  editingUserId,
  editingUser,
  onFaceChanged,
  codeInput,
  onCodeChange,
  roleInput,
  onRoleChange,
  fullNameInput,
  onFullNameChange,
  emailInput,
  onEmailChange,
  phoneInput,
  onPhoneChange,
  departmentInput,
  onDepartmentChange,
  statusInput,
  onStatusChange,
  departments,
  onClose,
  onConfirm,
}: {
  open: boolean
  editingUserId: string | null
  editingUser: AdminUser | null
  onFaceChanged: () => Promise<void>
  codeInput: string
  onCodeChange: (val: string) => void
  roleInput: AdminUser['role']
  onRoleChange: (val: AdminUser['role']) => void
  fullNameInput: string
  onFullNameChange: (val: string) => void
  emailInput: string
  onEmailChange: (val: string) => void
  phoneInput: string
  onPhoneChange: (val: string) => void
  departmentInput: string
  onDepartmentChange: (val: string) => void
  statusInput: AdminUser['status']
  onStatusChange: (val: AdminUser['status']) => void
  departments: Department[]
  onClose: () => void
  onConfirm: () => void
}) {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const codeEditedRef = useRef(false)
  useEffect(() => {
    if (open && !editingUserId) {
      let isMounted = true
      codeEditedRef.current = false
      getNextUserCode()
        .then((res) => {
          if (isMounted && !codeEditedRef.current && res?.code) {
            onCodeChange(res.code)
          }
        })
        .catch(() => undefined)
      return () => {
        isMounted = false
      }
    }
  }, [open, editingUserId, onCodeChange])

  return (
    <AdminModal
      open={open}
      title={editingUserId ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
      description="Tạo hoặc cập nhật tài khoản. Mật khẩu mặc định sẽ được sinh tự động."
      confirmText={editingUserId ? 'Cập nhật người dùng' : 'Tạo người dùng'}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Mã tài khoản">
            <AdminInput
              value={codeInput}
              onChange={(event) => {
                codeEditedRef.current = true
                onCodeChange(event.target.value.toUpperCase().replace(/\s+/g, ''))
              }}
              maxLength={30}
              autoCapitalize="characters"
              spellCheck={false}
              disabled={Boolean(editingUserId)}
              placeholder="VD: US000001"
            />
          </AdminField>
          <AdminField label="Vai trò">
            <AdminSelect
              value={roleInput}
              onChange={(value) => {
                onRoleChange(value as AdminUser['role'])
              }}
              disabled={Boolean(editingUserId)}
              options={[
                { value: 'STUDENT', label: 'Sinh viên' },
                { value: 'TEACHER', label: 'Giảng viên' },
                ...(isAdmin ? [{ value: 'ADMIN', label: 'Quản trị viên' }] : []),
                { value: 'EDUCATION_OFFICER', label: 'Giáo vụ' },
              ]}
            />
          </AdminField>
        </div>

        <AdminField label="Họ và tên">
          <AdminInput
            value={fullNameInput}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="VD: Trần Minh Nam"
          />
        </AdminField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Email">
            <AdminInput
              value={emailInput}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="VD: nam.tm@soes.edu.vn"
            />
          </AdminField>
          <AdminField label="Số điện thoại">
            <AdminInput
              value={phoneInput}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="VD: 0961234567"
            />
          </AdminField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Bộ môn">
            <AdminSelect
              value={roleInput === 'ADMIN' || roleInput === 'EDUCATION_OFFICER' ? 'NONE' : departmentInput}
              onChange={onDepartmentChange}
              disabled={roleInput === 'ADMIN' || roleInput === 'EDUCATION_OFFICER'}
              options={[
                { value: 'NONE', label: 'Không áp dụng' },
                ...departments.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <AdminSelect
              value={statusInput}
              onChange={(value) => onStatusChange(value as AdminUser['status'])}
              options={[
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'LOCKED', label: 'Bị khóa' },
              ]}
            />
          </AdminField>
        </div>
        {isAdmin && editingUser?.role === 'STUDENT' && editingUser.profileId &&
          <StudentFaceEnrollmentSection user={editingUser} studentId={editingUser.profileId} onChanged={onFaceChanged} />}
      </div>
    </AdminModal>
  )
}
