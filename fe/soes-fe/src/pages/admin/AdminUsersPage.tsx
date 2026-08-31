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
import { useAdminUsers } from './hooks/useAdminUsers'
import type { UserPayload } from './types/admin-api.types'
import type { AdminUser } from './types/admin.types'

export default function AdminUsersPage() {
  const data = useAdminUsers()
  const [role, setRole] = useState<'ALL' | AdminUser['role']>('ALL')
  const [departmentId, setDepartmentId] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | AdminUser['status']>('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [removeHeadUser, setRemoveHeadUser] = useState<AdminUser | null>(null)
  const [code, setCode] = useState('')
  const [userRole, setUserRole] = useState<AdminUser['role']>('STUDENT')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [userDepartmentId, setUserDepartmentId] = useState('NONE')
  const [userStatus, setUserStatus] = useState<AdminUser['status']>('ACTIVE')
  const [importText, setImportText] = useState('SV2026007, Nguyễn Văn Hùng, hung.nv@soes.edu.vn')

  const filteredUsers = useMemo(() => data.users.filter((item) =>
    (role === 'ALL' || item.role === role) &&
    (departmentId === 'ALL' || item.departmentId === departmentId) &&
    (status === 'ALL' || item.status === status) &&
    `${item.code} ${item.fullName} ${item.email}`.toLowerCase().includes(search.toLowerCase()),
  ), [data.users, departmentId, role, search, status])

  const resetForm = () => {
    setEditingUser(null); setCode(''); setUserRole('STUDENT'); setFullName(''); setEmail('')
    setPhone(''); setUserDepartmentId(data.departments[0]?.id ?? 'NONE'); setUserStatus('ACTIVE')
  }
  const openCreate = () => { resetForm(); setModalOpen(true) }
  const openEdit = (user: AdminUser) => {
    setEditingUser(user); setCode(user.code); setUserRole(user.role); setFullName(user.fullName)
    setEmail(user.email); setPhone(user.phone ?? ''); setUserDepartmentId(user.departmentId ?? 'NONE')
    setUserStatus(user.status); setModalOpen(true)
  }
  const payload = (): UserPayload => ({
    role: userRole, code: code.trim().toUpperCase(), fullName: fullName.trim(),
    email: email.trim().toLowerCase() || null, phoneNumber: phone.trim() || null,
    departmentId: userRole === 'TEACHER' ? userDepartmentId : null,
    status: userStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE', password: '123456',
  })

  const saveUser = async () => {
    const body = payload()
    if (!body.code || !body.fullName || !body.email) return toast.error('Vui lòng nhập mã, họ tên và email.')
    if (body.role === 'TEACHER' && (!body.departmentId || body.departmentId === 'NONE')) {
      return toast.error('Vui lòng chọn bộ môn cho giảng viên.')
    }
    try {
      if (editingUser) await data.update(editingUser, body)
      else await data.create(body)
      setModalOpen(false)
      toast.success(editingUser ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản với mật khẩu mặc định 123456.')
    } catch { toast.error('Không thể lưu tài khoản. Mã hoặc email có thể đã tồn tại.') }
  }

  const importStudents = async () => {
    const rows = importText.split('\n').map((line) => line.split(',').map((part) => part.trim())).filter((row) => row.some(Boolean))
    if (rows.some((row) => row.length < 3 || !row[2].includes('@'))) {
      return toast.error('Danh sách chưa đúng định dạng MSSV, Họ tên, Email.')
    }
    try {
      await Promise.all(rows.map(([studentCode, name, studentEmail]) => data.create({
        role: 'STUDENT', code: studentCode, fullName: name, email: studentEmail,
        status: 'ACTIVE', password: '123456',
      })))
      setImportOpen(false); toast.success(`Đã tạo ${rows.length} tài khoản sinh viên.`)
    } catch { toast.error('Không thể nhập toàn bộ danh sách. Vui lòng kiểm tra dữ liệu trùng.') }
  }

  const toggleHead = async (user: AdminUser) => {
    if (user.position === 'DEPARTMENT_HEAD') return setRemoveHeadUser(user)
    if (!user.departmentId) return toast.error('Giảng viên chưa thuộc bộ môn.')
    try { await data.setDepartmentHead(user.departmentId, user.id); toast.success('Đã bổ nhiệm Trưởng bộ môn.') }
    catch { toast.error('Không thể bổ nhiệm Trưởng bộ môn.') }
  }

  return (
    <AdminLayout>
      <AdminPageHeader icon={<Users size={20} />} title="Người dùng và Tài khoản"
        description="Quản lý sinh viên, giảng viên, admin; khóa/mở khóa, reset mật khẩu và bổ nhiệm Trưởng bộ môn."
        action={<div className="flex gap-2">
          <AdminButton tone="secondary" icon={<Upload size={17} />} onClick={() => setImportOpen(true)}>Nhập sinh viên</AdminButton>
          <AdminButton icon={<Plus size={17} />} onClick={openCreate}>Thêm người dùng</AdminButton>
        </div>} />
      <AdminTablePanel>
        <AdminToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm theo mã, họ tên hoặc email..."
          onReset={() => { setSearch(''); setRole('ALL'); setDepartmentId('ALL'); setStatus('ALL') }}
          filters={<>
            <AdminSelect value={role} onChange={setRole} className="w-44" options={[
              { value: 'ALL', label: 'Vai trò' }, { value: 'ADMIN', label: 'Quản trị viên' },
              { value: 'TEACHER', label: 'Giảng viên' }, { value: 'STUDENT', label: 'Sinh viên' },
            ]} />
            <AdminSelect value={departmentId} onChange={setDepartmentId} className="w-64" options={[
              { value: 'ALL', label: 'Bộ môn' }, ...data.departments.map(({ id, name }) => ({ value: id, label: name })),
            ]} />
            <AdminSelect value={status} onChange={setStatus} className="w-44" options={[
              { value: 'ALL', label: 'Trạng thái' }, { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'LOCKED', label: 'Bị khóa' },
            ]} />
          </>} />
        {data.loading && <p className="py-8 text-center text-sm text-slate-500">Đang tải người dùng...</p>}
        {data.error && <p className="py-8 text-center text-sm text-red-500">{data.error} <button className="ml-2 underline" onClick={data.retry}>Thử lại</button></p>}
        {!data.loading && !data.error && <UsersTable users={filteredUsers} onToggleDepartmentHead={(user) => void toggleHead(user)}
          onResetPassword={(user) => void data.resetPassword(user).then(() => toast.success('Đã đặt mật khẩu về 123456.')).catch(() => toast.error('Không thể đặt lại mật khẩu.'))}
          onEditUser={openEdit} onToggleLock={(user) => void data.setStatus(user, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
            .then(() => toast.success(user.status === 'ACTIVE' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.'))
            .catch(() => toast.error('Không thể đổi trạng thái tài khoản.'))} />}
      </AdminTablePanel>
      <UserFormModal open={modalOpen} editingUserId={editingUser?.id ?? null} codeInput={code} onCodeChange={setCode}
        roleInput={userRole} onRoleChange={setUserRole} fullNameInput={fullName} onFullNameChange={setFullName}
        emailInput={email} onEmailChange={setEmail} phoneInput={phone} onPhoneChange={setPhone}
        departmentInput={userDepartmentId} onDepartmentChange={setUserDepartmentId} statusInput={userStatus}
        onStatusChange={setUserStatus} departments={data.departments} onClose={() => setModalOpen(false)} onConfirm={() => void saveUser()} />
      <UserImportModal open={importOpen} value={importText} onChange={setImportText} onClose={() => setImportOpen(false)} onConfirm={() => void importStudents()} />
      <RemoveDepartmentHeadDialog user={removeHeadUser} onClose={() => setRemoveHeadUser(null)} onConfirm={() => {
        if (!removeHeadUser?.departmentId) return
        void data.setDepartmentHead(removeHeadUser.departmentId, null)
          .then(() => { toast.success('Đã gỡ chức danh Trưởng bộ môn.'); setRemoveHeadUser(null) })
          .catch(() => toast.error('Không thể gỡ chức danh Trưởng bộ môn.'))
      }} />
    </AdminLayout>
  )
}
