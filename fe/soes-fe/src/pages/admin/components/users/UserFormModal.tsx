import { useEffect, useRef } from 'react'
import { Check, Plus } from 'lucide-react'
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
  rolesInput,
  onRolesChange,
  existingRoles,
  onAddRole,
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
  rolesInput: AdminUser['role'][]
  onRolesChange: (roles: AdminUser['role'][]) => void
  existingRoles: AdminUser['role'][]
  onAddRole: (role: 'STUDENT' | 'TEACHER' | 'EDUCATION_OFFICER') => void
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
  const addableRoles: ('STUDENT' | 'TEACHER' | 'EDUCATION_OFFICER')[] =
    editingUserId && existingRoles.length < 3 && !existingRoles.includes('ADMIN')
    ? (['STUDENT', 'TEACHER', 'EDUCATION_OFFICER'] as const).filter((role) => !existingRoles.includes(role))
    : []
  const canSelectDepartment = roleInput === 'TEACHER' || (!editingUserId && rolesInput.includes('TEACHER')) || addableRoles.includes('TEACHER')
  const toggleRole = (role: AdminUser['role']) => {
    if (role === 'ADMIN') {
      onRolesChange(rolesInput.includes('ADMIN') ? ['STUDENT'] : ['ADMIN'])
    } else if (rolesInput.includes(role)) {
      if (rolesInput.length > 1) onRolesChange(rolesInput.filter((item) => item !== role))
    } else {
      const selected = rolesInput.filter((item) => item !== 'ADMIN')
      onRolesChange([...selected, role])
    }
  }
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
      description={editingUserId
        ? 'Chỉnh sửa thông tin và thêm vai trò cho tài khoản hiện tại.'
        : 'Tạo tài khoản mới với mật khẩu mặc định.'}
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
            {editingUserId ? (
              <div className="flex min-h-12 flex-wrap items-center gap-2">
                {existingRoles.map((role) => <span key={role}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  <Check size={15} />
                  {role === 'STUDENT' ? 'Sinh viên' : role === 'TEACHER' ? 'Giảng viên' : role === 'ADMIN' ? 'Quản trị viên' : 'Giáo vụ'}
                </span>)}
                {addableRoles.map((role) => <button key={role} type="button" onClick={() => onAddRole(role)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <Plus size={15} />
                  {role === 'STUDENT' ? 'Sinh viên' : role === 'TEACHER' ? 'Giảng viên' : 'Giáo vụ'}
                </button>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['STUDENT', 'Sinh viên'], ['TEACHER', 'Giảng viên'],
                  ...(isAdmin ? [['ADMIN', 'Quản trị viên']] : []),
                  ['EDUCATION_OFFICER', 'Giáo vụ'],
                ] as [AdminUser['role'], string][]).map(([role, label]) => {
                  const selected = rolesInput.includes(role)
                  const disabled = rolesInput.includes('ADMIN') && role !== 'ADMIN'
                  return <button key={role} type="button" aria-pressed={selected} disabled={disabled}
                    onClick={() => toggleRole(role)}
                    className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${
                      selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
                        'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400`}>
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                      {selected && <Check size={13} strokeWidth={3} />}
                    </span>
                    {label}
                  </button>
                })}
              </div>
            )}
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
          <AdminField label={editingUserId && addableRoles.includes('TEACHER') ? 'Bộ môn nếu thêm vai trò Giảng viên' : 'Bộ môn'}>
            <AdminSelect
              value={canSelectDepartment ? departmentInput : 'NONE'}
              onChange={onDepartmentChange}
              disabled={!canSelectDepartment}
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
