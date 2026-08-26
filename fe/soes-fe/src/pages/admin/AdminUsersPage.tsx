import { Plus, Upload, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'
import RemoveDepartmentHeadDialog from './components/users/RemoveDepartmentHeadDialog'
import UserFormModal from './components/users/UserFormModal'
import UserImportModal from './components/users/UserImportModal'
import UsersTable from './components/users/UsersTable'
import { ADMIN_DEPARTMENTS, ADMIN_USERS } from './mock/admin.mock'
import type { AdminUser } from './types/admin.types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS)
  const [role, setRole] = useState<'ALL' | AdminUser['role']>('ALL')
  const [department, setDepartment] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | AdminUser['status']>('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [removeHeadUser, setRemoveHeadUser] = useState<AdminUser | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [roleInput, setRoleInput] = useState<AdminUser['role']>('STUDENT')
  const [fullNameInput, setFullNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [departmentInput, setDepartmentInput] = useState(ADMIN_DEPARTMENTS[0]?.name ?? '')
  const [statusInput, setStatusInput] = useState<AdminUser['status']>('ACTIVE')
  const [importText, setImportText] = useState(
    'SV2026007, Nguyễn Văn Hùng, hung.nv@soes.edu.vn\nSV2026008, Phạm Thị Mai, mai.pt@soes.edu.vn',
  )

  const filteredUsers = useMemo(
    () =>
      users.filter((item) => {
        const matchesRole = role === 'ALL' || item.role === role
        const matchesDepartment = department === 'ALL' || item.departmentName === department
        const matchesStatus = status === 'ALL' || item.status === status
        const matchesSearch =
          item.code.toLowerCase().includes(search.toLowerCase()) ||
          item.fullName.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase())
        return matchesRole && matchesDepartment && matchesStatus && matchesSearch
      }),
    [department, role, search, status, users],
  )

  const resetUserForm = () => {
    setEditingUserId(null)
    setCodeInput('')
    setRoleInput('STUDENT')
    setFullNameInput('')
    setEmailInput('')
    setPhoneInput('')
    setDepartmentInput(ADMIN_DEPARTMENTS[0]?.name ?? '')
    setStatusInput('ACTIVE')
  }

  const openCreateModal = () => {
    resetUserForm()
    setModalOpen(true)
  }

  const openEditModal = (user: AdminUser) => {
    setEditingUserId(user.id)
    setCodeInput(user.code)
    setRoleInput(user.role)
    setFullNameInput(user.fullName)
    setEmailInput(user.email)
    setPhoneInput(user.phone ?? '')
    setDepartmentInput(user.departmentName ?? ADMIN_DEPARTMENTS[0]?.name ?? '')
    setStatusInput(user.status)
    setModalOpen(true)
  }

  const handleSaveUser = () => {
    const codeValue = codeInput.trim().toUpperCase()
    const fullNameValue = fullNameInput.trim()
    const emailValue = emailInput.trim().toLowerCase()
    const phoneValue = phoneInput.trim()

    if (!codeValue || !fullNameValue || !emailValue) {
      toast.error('Vui lòng nhập mã, họ tên và email.')
      return
    }

    const isDuplicate = users.some(
      (user) =>
        user.id !== editingUserId &&
        (user.code.toLowerCase() === codeValue.toLowerCase() ||
          user.email.toLowerCase() === emailValue.toLowerCase()),
    )
    if (isDuplicate) {
      toast.error('Mã hoặc email đã tồn tại.')
      return
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                code: codeValue,
                fullName: fullNameValue,
                email: emailValue,
                phone: phoneValue || undefined,
                role: roleInput,
                departmentName: roleInput === 'ADMIN' ? undefined : departmentInput,
                status: statusInput,
                position: roleInput === 'TEACHER' ? user.position ?? 'LECTURER' : undefined,
              }
            : user,
        ),
      )
      setModalOpen(false)
      toast.success(`Đã cập nhật tài khoản ${codeValue}.`)
      return
    }

    setUsers((prev) => [
      ...prev,
      {
        id: createEntityId('u', codeValue),
        code: codeValue,
        fullName: fullNameValue,
        email: emailValue,
        phone: phoneValue || undefined,
        role: roleInput,
        departmentName: roleInput === 'ADMIN' ? undefined : departmentInput,
        position: roleInput === 'TEACHER' ? 'LECTURER' : undefined,
        status: statusInput,
      },
    ])
    setModalOpen(false)
    toast.success(`Đã tạo tài khoản ${codeValue}.`)
  }

  const handleImportStudents = () => {
    const rows = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(',').map((part) => part.trim()))

    const invalidRow = rows.find((row) => row.length < 3 || !row[0] || !row[1] || !row[2].includes('@'))
    if (invalidRow) {
      toast.error('Danh sách có dòng chưa đúng định dạng MSSV, Họ tên, Email.')
      return
    }

    const existingKeys = new Set(users.flatMap((user) => [user.code.toLowerCase(), user.email.toLowerCase()]))
    const duplicateRow = rows.find(
      ([code, , email]) =>
        existingKeys.has(code.toLowerCase()) || existingKeys.has(email.toLowerCase()),
    )
    if (duplicateRow) {
      toast.error(`Mã hoặc email đã tồn tại: ${duplicateRow[0]}.`)
      return
    }

    setUsers((prev) => [
      ...prev,
      ...rows.map(([code, fullName, email]) => ({
        id: createEntityId('u', code),
        code: code.toUpperCase(),
        fullName,
        email: email.toLowerCase(),
        role: 'STUDENT' as const,
        departmentName: ADMIN_DEPARTMENTS[0]?.name,
        status: 'ACTIVE' as const,
      })),
    ])
    setImportModalOpen(false)
    toast.success(`Đã kiểm tra và thêm ${rows.length} sinh viên.`)
  }

  const handleResetPassword = (user: AdminUser) => {
    toast.success(`Đã đặt lại mật khẩu ${user.code} về mặc định 123456.`)
  }

  const handleToggleLock = (user: AdminUser) => {
    const nextStatus: AdminUser['status'] = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, status: nextStatus } : row)))
    toast.success(nextStatus === 'ACTIVE' ? `Đã mở khóa ${user.code}.` : `Đã khóa ${user.code}.`)
  }

  const handleToggleDepartmentHead = (user: AdminUser) => {
    if (user.position === 'DEPARTMENT_HEAD') {
      setRemoveHeadUser(user)
      return
    }

    setUsers((prev) =>
      prev.map((row) => (row.id === user.id ? { ...row, position: 'DEPARTMENT_HEAD' } : row)),
    )
    toast.success(`Đã bổ nhiệm ${user.fullName} làm Trưởng bộ môn.`)
  }

  const handleConfirmRemoveDepartmentHead = () => {
    if (!removeHeadUser) return

    setUsers((prev) =>
      prev.map((row) => (row.id === removeHeadUser.id ? { ...row, position: 'LECTURER' } : row)),
    )
    toast.success(`Đã gỡ chức danh Trưởng bộ môn của ${removeHeadUser.fullName}.`)
    setRemoveHeadUser(null)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Users size={20} />}
        title="Người dùng và Tài khoản"
        description="Quản lý sinh viên, giảng viên, admin; khóa/mở khóa, reset mật khẩu và bổ nhiệm Trưởng bộ môn."
        action={
          <div className="flex gap-2">
            <AdminButton tone="secondary" icon={<Upload size={17} />} onClick={() => setImportModalOpen(true)}>
              Nhập sinh viên
            </AdminButton>
            <AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>
              Thêm người dùng
            </AdminButton>
          </div>
        }
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo mã, họ tên hoặc email..."
          onReset={() => {
            setSearch('')
            setRole('ALL')
            setDepartment('ALL')
            setStatus('ALL')
          }}
          filters={
            <>
              <AdminSelect
                value={role}
                onChange={setRole}
                className="w-44"
                options={[
                  { value: 'ALL', label: 'Vai trò' },
                  { value: 'ADMIN', label: 'Quản trị viên' },
                  { value: 'TEACHER', label: 'Giảng viên' },
                  { value: 'STUDENT', label: 'Sinh viên' },
                ]}
              />
              <AdminSelect
                value={department}
                onChange={setDepartment}
                className="w-64"
                options={[
                  { value: 'ALL', label: 'Bộ môn' },
                  ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.name, label: item.name })),
                ]}
              />
              <AdminSelect
                value={status}
                onChange={setStatus}
                className="w-44"
                options={[
                  { value: 'ALL', label: 'Trạng thái' },
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'LOCKED', label: 'Bị khóa' },
                ]}
              />
            </>
          }
        />
        <UsersTable
          users={filteredUsers}
          onToggleDepartmentHead={handleToggleDepartmentHead}
          onResetPassword={handleResetPassword}
          onEditUser={openEditModal}
          onToggleLock={handleToggleLock}
        />
      </AdminTablePanel>

      <UserFormModal
        open={modalOpen}
        editingUserId={editingUserId}
        codeInput={codeInput}
        onCodeChange={setCodeInput}
        roleInput={roleInput}
        onRoleChange={setRoleInput}
        fullNameInput={fullNameInput}
        onFullNameChange={setFullNameInput}
        emailInput={emailInput}
        onEmailChange={setEmailInput}
        phoneInput={phoneInput}
        onPhoneChange={setPhoneInput}
        departmentInput={departmentInput}
        onDepartmentChange={setDepartmentInput}
        statusInput={statusInput}
        onStatusChange={setStatusInput}
        onClose={() => {
          setModalOpen(false)
          setEditingUserId(null)
        }}
        onConfirm={handleSaveUser}
      />

      <UserImportModal
        open={importModalOpen}
        value={importText}
        onChange={setImportText}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImportStudents}
      />

      <RemoveDepartmentHeadDialog
        user={removeHeadUser}
        onClose={() => setRemoveHeadUser(null)}
        onConfirm={handleConfirmRemoveDepartmentHead}
      />
    </AdminLayout>
  )
}

function createEntityId(prefix: string, value: string) {
  return `${prefix}-${value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}
