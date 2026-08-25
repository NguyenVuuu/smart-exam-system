import { AlertTriangle, Crown, Edit, KeyRound, Lock, Plus, Unlock, Upload, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_DEPARTMENTS, ADMIN_USERS } from './mock/admin.mock'
import type { AdminUser } from './types/admin.types'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput, AdminTextarea } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

const roleLabel: Record<AdminUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
}

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

  const filteredUsers = useMemo(() => users.filter((item) => {
    const matchesRole = role === 'ALL' || item.role === role
    const matchesDepartment = department === 'ALL' || item.departmentName === department
    const matchesStatus = status === 'ALL' || item.status === status
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesDepartment && matchesStatus && matchesSearch
  }), [department, role, search, status, users])

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

    const isDuplicate = users.some((user) =>
      user.id !== editingUserId &&
      (user.code.toLowerCase() === codeValue.toLowerCase() || user.email.toLowerCase() === emailValue.toLowerCase()),
    )
    if (isDuplicate) {
      toast.error('Mã hoặc email đã tồn tại.')
      return
    }

    if (editingUserId) {
      setUsers((prev) => prev.map((user) => user.id === editingUserId
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
      ))
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
    const duplicateRow = rows.find(([code, , email]) =>
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
    setUsers((prev) => prev.map((row) => row.id === user.id ? { ...row, status: nextStatus } : row))
    toast.success(nextStatus === 'ACTIVE' ? `Đã mở khóa ${user.code}.` : `Đã khóa ${user.code}.`)
  }

  const handleToggleDepartmentHead = (user: AdminUser) => {
    if (user.position === 'DEPARTMENT_HEAD') {
      setRemoveHeadUser(user)
      return
    }

    setUsers((prev) => prev.map((row) =>
      row.id === user.id ? { ...row, position: 'DEPARTMENT_HEAD' } : row,
    ))
    toast.success(`Đã bổ nhiệm ${user.fullName} làm Trưởng bộ môn.`)
  }

  const handleConfirmRemoveDepartmentHead = () => {
    if (!removeHeadUser) return

    setUsers((prev) => prev.map((row) =>
      row.id === removeHeadUser.id ? { ...row, position: 'LECTURER' } : row,
    ))
    toast.success(`Đã gỡ chức danh Trưởng bộ môn của ${removeHeadUser.fullName}.`)
    setRemoveHeadUser(null)
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      header: 'NGƯỜI DÙNG',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${item.role === 'ADMIN' ? 'bg-rose-600' : item.role === 'TEACHER' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
            {item.fullName.split(' ').slice(-1)[0].slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">{item.fullName}</p>
              {item.position === 'DEPARTMENT_HEAD' && <Crown size={14} className="text-amber-500" />}
            </div>
            <p className="text-xs text-slate-400">{item.code}</p>
          </div>
        </div>
      ),
    },
    { header: 'EMAIL', width: '250px', render: (item) => <span className="text-sm text-slate-700">{item.email}</span> },
    { header: 'VAI TRÒ', width: '150px', render: (item) => <AppBadge tone={item.role === 'ADMIN' ? 'rose' : item.role === 'TEACHER' ? 'emerald' : 'blue'}>{roleLabel[item.role]}</AppBadge> },
    {
      header: 'BỘ MÔN / CHỨC DANH',
      width: '260px',
      render: (item) => (
        item.position === 'DEPARTMENT_HEAD'
          ? <AppBadge tone="amber">Trưởng bộ môn</AppBadge>
          : <span className="text-sm text-slate-600">{item.departmentName ?? '—'}</span>
      ),
    },
    { header: 'TRẠNG THÁI', width: '150px', render: (item) => <UserStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '160px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          {item.role === 'TEACHER' && (
            <button
              className="rounded-lg p-1.5 hover:bg-amber-50 hover:text-amber-600"
              title="Bổ nhiệm/gỡ Trưởng bộ môn"
              onClick={() => handleToggleDepartmentHead(item)}
            >
              <Crown size={17} />
            </button>
          )}
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Reset mật khẩu" onClick={() => handleResetPassword(item)}><KeyRound size={17} /></button>
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Chỉnh sửa" onClick={() => openEditModal(item)}><Edit size={17} /></button>
          <button
            className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"
            title={item.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
            onClick={() => handleToggleLock(item)}
          >
            {item.status === 'LOCKED' ? <Unlock size={17} /> : <Lock size={17} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Users size={20} />}
        title="Người dùng và Tài khoản"
        description="Quản lý sinh viên, giảng viên, admin; khóa/mở khóa, reset mật khẩu và bổ nhiệm Trưởng bộ môn."
        action={(
          <div className="flex gap-2">
            <AdminButton tone="secondary" icon={<Upload size={17} />} onClick={() => setImportModalOpen(true)}>Nhập sinh viên</AdminButton>
            <AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>Thêm người dùng</AdminButton>
          </div>
        )}
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
          filters={(
            <>
              <AdminSelect value={role} onChange={setRole} className="w-44" options={[
                { value: 'ALL', label: 'Vai trò' },
                { value: 'ADMIN', label: 'Quản trị viên' },
                { value: 'TEACHER', label: 'Giảng viên' },
                { value: 'STUDENT', label: 'Sinh viên' },
              ]} />
              <AdminSelect value={department} onChange={setDepartment} className="w-64" options={[
                { value: 'ALL', label: 'Bộ môn' },
                ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.name, label: item.name })),
              ]} />
              <AdminSelect value={status} onChange={setStatus} className="w-44" options={[
                { value: 'ALL', label: 'Trạng thái' },
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'LOCKED', label: 'Bị khóa' },
              ]} />
            </>
          )}
        />
        <DataTable columns={columns} data={filteredUsers} keyExtractor={(item) => item.id} emptyText="Chưa có tài khoản phù hợp." />
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title={editingUserId ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
        description="Tạo hoặc cập nhật tài khoản. Mật khẩu mặc định sẽ được sinh tự động."
        confirmText={editingUserId ? 'Cập nhật người dùng' : 'Tạo người dùng'}
        onClose={() => {
          setModalOpen(false)
          setEditingUserId(null)
        }}
        onConfirm={handleSaveUser}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Mã (MSSV / MSGV)">
              <AdminInput value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="VD: SV2026001 hoặc GV001" />
            </AdminField>
            <AdminField label="Vai trò">
              <AdminSelect
                value={roleInput}
                onChange={(value) => setRoleInput(value as AdminUser['role'])}
                options={[
                  { value: 'STUDENT', label: 'Sinh viên' },
                  { value: 'TEACHER', label: 'Giảng viên' },
                  { value: 'ADMIN', label: 'Quản trị viên' },
                ]}
              />
            </AdminField>
          </div>

          <AdminField label="Họ và tên">
            <AdminInput value={fullNameInput} onChange={(event) => setFullNameInput(event.target.value)} placeholder="VD: Trần Minh Nam" />
          </AdminField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Email">
              <AdminInput value={emailInput} onChange={(event) => setEmailInput(event.target.value)} placeholder="VD: nam.tm@soes.edu.vn" />
            </AdminField>
            <AdminField label="Số điện thoại">
              <AdminInput value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} placeholder="VD: 0961234567" />
            </AdminField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Bộ môn">
              <AdminSelect
                value={roleInput === 'ADMIN' ? 'NONE' : departmentInput}
                onChange={setDepartmentInput}
                disabled={roleInput === 'ADMIN'}
                options={[
                  { value: 'NONE', label: 'Không áp dụng' },
                  ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.name, label: item.name })),
                ]}
              />
            </AdminField>
            <AdminField label="Trạng thái">
              <AdminSelect
                value={statusInput}
                onChange={(value) => setStatusInput(value as AdminUser['status'])}
                options={[
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'LOCKED', label: 'Bị khóa' },
                ]}
              />
            </AdminField>
          </div>
        </div>
      </AdminModal>

      <ImportStudentsModal
        open={importModalOpen}
        value={importText}
        onChange={setImportText}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImportStudents}
      />

      <RemoveDepartmentHeadConfirm
        user={removeHeadUser}
        onClose={() => setRemoveHeadUser(null)}
        onConfirm={handleConfirmRemoveDepartmentHead}
      />
    </AdminLayout>
  )
}

function RemoveDepartmentHeadConfirm({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!user) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Gỡ trưởng bộ môn</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle size={23} />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Gỡ chức danh trưởng bộ môn của {user.fullName}?
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Hủy</AdminButton>
          <AdminButton tone="danger" onClick={onConfirm}>Xác nhận</AdminButton>
        </div>
      </div>
    </div>
  )
}

function ImportStudentsModal({
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
          <AdminButton tone="secondary" onClick={onClose}>Đóng</AdminButton>
          <AdminButton onClick={onConfirm}>Kiểm tra danh sách</AdminButton>
        </div>
      </div>
    </div>
  )
}

function UserStatusBadge({ status }: { status: AdminUser['status'] }) {
  return status === 'ACTIVE'
    ? <AppBadge tone="emerald">Hoạt động</AppBadge>
    : <AppBadge tone="rose">Bị khóa</AppBadge>
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
