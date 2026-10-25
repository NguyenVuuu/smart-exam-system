import { AlertCircle, RefreshCw, Search, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../api/errors'
import { useAuthStore } from '../../store/authStore'
import type { UserPermission } from '../../types/auth.types'
import {
  getPermissionsWorkspace,
  updatePermission,
  updateRolePermission,
  type BackofficeAccount,
  type PermissionItem,
  type PermissionsWorkspace,
} from './api/admin-permissions.api'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import PermissionMatrix from './components/permissions/PermissionMatrix'

type BackofficeRole = 'ADMIN' | 'EDUCATION_OFFICER'
type ChangeTarget =
  | { kind: 'role'; role: BackofficeRole; name: string; permissions: UserPermission[] }
  | { kind: 'account'; account: BackofficeAccount }

type PendingChange = {
  target: ChangeTarget
  item: PermissionItem
  allowed: boolean | null
}

const roleName = (role: BackofficeRole) => role === 'ADMIN' ? 'Quản trị viên' : 'Giáo vụ'

export default function AdminPermissionsPage() {
  const [workspace, setWorkspace] = useState<PermissionsWorkspace | null>(null)
  const [mode, setMode] = useState<'roles' | 'accounts'>('roles')
  const [selectedRole, setSelectedRole] = useState<BackofficeRole>('EDUCATION_OFFICER')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<PendingChange | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const applyWorkspace = (data: PermissionsWorkspace) => {
    setWorkspace(data)
    const currentUser = useAuthStore.getState().user
    const ownAccount = data.accounts.find((item) => item.id === currentUser?.profileId)
    if (currentUser && ownAccount) {
      useAuthStore.getState().setUser({ ...currentUser, permissions: ownAccount.permissions })
    }
    setSelectedId((current) =>
      current && data.accounts.some(({ id }) => id === current)
        ? current
        : ownAccount?.id ?? data.accounts[0]?.id ?? null,
    )
  }

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      applyWorkspace(await getPermissionsWorkspace())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getPermissionsWorkspace()
      .then((data) => {
        if (!active) return
        applyWorkspace(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  const selectedAccount = workspace?.accounts.find(({ id }) => id === selectedId)
  const selectedRoleEntry = workspace?.roles.find(({ role }) => role === selectedRole)
  const filteredAccounts = workspace?.accounts.filter((item) =>
    (item.code + ' ' + item.fullName + ' ' + (item.email ?? '')).toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  const target: ChangeTarget | null = mode === 'roles'
    ? selectedRoleEntry
      ? { kind: 'role', role: selectedRole, name: roleName(selectedRole), permissions: selectedRoleEntry.permissions }
      : null
    : selectedAccount
      ? { kind: 'account', account: selectedAccount }
      : null

  const openChange = (item: PermissionItem, allowed: boolean | null) => {
    if (!target) return
    setPending({ target, item, allowed })
    setReason('')
  }

  const confirmChange = async () => {
    if (!pending || reason.trim().length < 3) return
    setSaving(true)
    try {
      if (pending.target.kind === 'role') {
        await updateRolePermission(pending.target.role, pending.item.key, pending.allowed === true, reason.trim())
      } else {
        await updatePermission(pending.target.account.id, pending.item.key, pending.allowed, reason.trim())
      }
      setPending(null)
      setReason('')
      await load()
      toast.success(pending.allowed === null
        ? 'Đã dùng lại quyền theo vai trò.'
        : pending.allowed ? 'Đã cấp quyền.' : 'Đã thu hồi quyền.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật quyền.'))
    } finally {
      setSaving(false)
    }
  }

  const pendingPermissions = pending?.target.kind === 'role'
    ? pending.target.permissions
    : pending?.target.account.permissions ?? []
  const revokeRelatedManage = pending?.allowed === false
    && pending.item.includedBy
    && pendingPermissions.includes(pending.item.includedBy)

  return (
    <AdminLayout noScroll>
      <AdminPageHeader
        className="mb-4 shrink-0"
        icon={<ShieldCheck size={20} />}
        title="Phân quyền"
        description="Thiết lập quyền theo vai trò và điều chỉnh quyền cho từng tài khoản."
        action={
          <AdminButton
            tone="secondary"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={() => void load()}
            disabled={loading}
          >
            Làm mới
          </AdminButton>
        }
      />

      <div role="tablist" aria-label="Phạm vi phân quyền" className="mb-4 flex shrink-0 gap-1 self-start rounded-lg border border-slate-200 bg-white p-1">
        <button
          role="tab"
          aria-selected={mode === 'roles'}
          type="button"
          onClick={() => setMode('roles')}
          className={mode === 'roles'
            ? 'rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white'
            : 'rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50'}
        >
          Vai trò
        </button>
        <button
          role="tab"
          aria-selected={mode === 'accounts'}
          type="button"
          onClick={() => setMode('accounts')}
          className={mode === 'accounts'
            ? 'rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white'
            : 'rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50'}
        >
          Tài khoản
        </button>
      </div>

      {loading && (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">Đang tải quyền truy cập...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
          <p className="text-sm text-rose-600">Không thể tải dữ liệu phân quyền.</p>
          <button type="button" onClick={() => void load()} className="mt-2 text-sm font-semibold text-emerald-700 hover:underline">Thử lại</button>
        </div>
      )}

      {!loading && !error && workspace && (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-1">
            <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50/40 lg:border-r lg:border-b-0 max-lg:max-h-44">
              {mode === 'accounts' && (
                <div className="relative shrink-0 border-b border-slate-200 p-3">
                  <Search size={16} className="pointer-events-none absolute top-6 left-6 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm tài khoản..."
                    aria-label="Tìm tài khoản"
                    className="h-10 w-full rounded-md border border-slate-200 bg-white pr-8 pl-9 text-sm outline-none focus:border-emerald-600"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} title="Xóa tìm kiếm" className="absolute top-5 right-6 text-slate-400 hover:text-slate-700">
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
                {mode === 'roles'
                  ? workspace.roles.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={selectedRole === item.role
                        ? 'mb-1 w-full rounded-md bg-emerald-50 px-3 py-3 text-left text-emerald-950'
                        : 'mb-1 w-full rounded-md px-3 py-3 text-left text-slate-700 hover:bg-slate-100'}
                    >
                      <span className="block text-sm font-semibold">{roleName(item.role)}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{item.permissions.length} quyền mặc định</span>
                    </button>
                  ))
                  : filteredAccounts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={selectedId === item.id
                        ? 'mb-1 w-full rounded-md bg-emerald-50 px-3 py-3 text-left text-emerald-950'
                        : 'mb-1 w-full rounded-md px-3 py-3 text-left text-slate-700 hover:bg-slate-100'}
                    >
                      <span className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{item.fullName}</span>
                        <span className="shrink-0 text-xs text-slate-500">{roleName(item.role)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{item.code} · {item.email || 'Chưa có email'}</span>
                    </button>
                  ))}
                {mode === 'accounts' && filteredAccounts.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">Không có tài khoản phù hợp.</p>
                )}
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col" aria-label="Bảng quyền">
              {target ? (
                <>
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">
                        {target.kind === 'role' ? target.name : target.account.fullName}
                      </h2>
                      <p className="truncate text-xs text-slate-500">
                        {target.kind === 'role'
                          ? 'Quyền mặc định của vai trò'
                          : target.account.code + ' · ' + roleName(target.account.role) + ' · ' + (target.account.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động')}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {(target.kind === 'role' ? target.permissions : target.account.permissions).length} / {workspace.catalog.length} quyền
                    </span>
                  </div>
                  <PermissionMatrix
                    catalog={workspace.catalog}
                    permissions={target.kind === 'role' ? target.permissions : target.account.permissions}
                    overrides={target.kind === 'account' ? target.account.overrides : undefined}
                    onChange={openChange}
                    onReset={target.kind === 'account' ? (item) => openChange(item, null) : undefined}
                  />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Chọn một mục để xem quyền.</div>
              )}
            </section>
          </div>
        </div>
      )}

      <AdminModal
        open={Boolean(pending)}
        title={pending?.allowed === null ? 'Dùng quyền theo vai trò' : pending?.allowed ? 'Cấp quyền' : 'Thu hồi quyền'}
        description={pending
          ? pending.item.label + ' · ' + (pending.target.kind === 'role' ? pending.target.name : pending.target.account.fullName)
          : undefined}
        confirmText={saving ? 'Đang lưu...' : pending?.allowed === null ? 'Khôi phục' : pending?.allowed ? 'Cấp quyền' : 'Thu hồi quyền'}
        confirmDisabled={saving || reason.trim().length < 3}
        onClose={() => { if (!saving) setPending(null) }}
        onConfirm={() => void confirmChange()}
        size="md"
      >
        {pending && (
          <div className="space-y-4">
            {revokeRelatedManage && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <span>Quyền quản lý tương ứng cũng sẽ bị thu hồi.</span>
              </div>
            )}
            <div>
              <label htmlFor="permission-reason" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Lý do thay đổi <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="permission-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Nhập lý do (tối thiểu 3 ký tự)"
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        )}
      </AdminModal>
    </AdminLayout>
  )
}
