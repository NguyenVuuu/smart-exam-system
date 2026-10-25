import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../api/errors'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import {
  addReviewGroupMember, createReviewGroup, listReviewCandidates, listReviewDepartments,
  listReviewGroups, removeReviewGroupMember, renameReviewGroup, setReviewGroupStatus,
  type BackofficeReviewGroup, type ReviewCandidate, type ReviewDepartment,
} from './api/admin-review-groups.api'

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500'
const buttonClass = 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

export default function AdminReviewGroupsPage() {
  const user = useAuthStore((state) => state.user)
  const canManage = Boolean(user?.permissions?.includes('REVIEW_GROUP_MANAGE_ALL'))
  const [groups, setGroups] = useState<BackofficeReviewGroup[]>([])
  const [departments, setDepartments] = useState<ReviewDepartment[]>([])
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [name, setName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [reason, setReason] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selected = groups.find((group) => group.id === selectedId)
  const availableDepartments = departments.filter((department) => department.status === 'ACTIVE' && !department.reviewGroup)
  const availableCandidates = candidates.filter((candidate) => !selected?.members.some((member) => member.teacherId === candidate.id))

  const refresh = async () => {
    const [nextGroups, nextDepartments] = await Promise.all([listReviewGroups(), listReviewDepartments()])
    setGroups(nextGroups)
    setDepartments(nextDepartments)
    setSelectedId((current) => nextGroups.some((group) => group.id === current) ? current : nextGroups[0]?.id ?? '')
  }

  useEffect(() => {
    let active = true
    Promise.all([listReviewGroups(), listReviewDepartments()])
      .then(([nextGroups, nextDepartments]) => {
        if (!active) return
        setGroups(nextGroups)
        setDepartments(nextDepartments)
        setSelectedId(nextGroups[0]?.id ?? '')
      })
      .catch(() => { if (active) toast.error('Không thể tải danh sách nhóm duyệt đề.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!canManage || !selectedId) return
    let active = true
    listReviewCandidates(selectedId)
      .then((items) => { if (active) setCandidates(items) })
      .catch(() => { if (active) setCandidates([]) })
    return () => { active = false }
  }, [canManage, selectedId])

  const perform = async (action: () => Promise<unknown>, message: string) => {
    if (reason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do ít nhất 5 ký tự.')
      return
    }
    setSaving(true)
    try {
      await action()
      await refresh()
      setReason('')
      toast.success(message)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật nhóm duyệt đề.'))
    } finally { setSaving(false) }
  }

  return <AdminLayout>
    <AdminPageHeader icon={<ShieldCheck size={22} />} title="Nhóm duyệt đề" description="Xem nhóm duyệt cố định của tất cả bộ môn. Tài khoản được cấp quyền có thể hỗ trợ cập nhật nhóm." />
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Bộ môn ({groups.length})</h2>
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : groups.length === 0 ? <p className="text-sm text-slate-500">Chưa có nhóm duyệt đề.</p> : (
          <div className="space-y-1">
            {groups.map((group) => <button key={group.id} type="button" onClick={() => { setSelectedId(group.id); setName(group.name); setTeacherId(''); setCandidates([]) }} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selectedId === group.id ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'}`}>
              <span className="block font-semibold">{group.department.name}</span>
              <span className="text-xs text-slate-500">{group.department.code} · {group.members.length} thành viên · {group.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã ngừng'}</span>
            </button>)}
          </div>
        )}
      </aside>

      <section className="space-y-5">
        {selected && <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-lg font-semibold text-slate-950">{selected.name}</h2><p className="text-sm text-slate-500">{selected.department.code} · {selected.department.name}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{selected.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã ngừng'}</span>
          </div>
          <h3 className="mb-2 mt-5 text-sm font-semibold">Thành viên nhóm</h3>
          <div className="divide-y divide-slate-100">
            {selected.members.map((member) => <div key={member.teacherId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{member.teacher.user.fullName} <span className="text-slate-500">({member.teacher.teacherCode})</span></span>
              {canManage && member.teacher.position !== 'DEPARTMENT_HEAD' && <button type="button" disabled={saving} className="text-rose-700 disabled:opacity-50" onClick={() => void perform(() => removeReviewGroupMember(selected.id, member.teacherId, reason.trim()), 'Đã loại thành viên khỏi nhóm.')} >Loại khỏi nhóm</button>}
            </div>)}
            {selected.members.length === 0 && <p className="py-3 text-sm text-slate-500">Nhóm chưa có thành viên đang hoạt động.</p>}
          </div>
        </div>}

        {canManage && <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div><h2 className="font-semibold text-slate-950">Hỗ trợ quản lý nhóm</h2><p className="text-sm text-slate-500">Mọi thay đổi cần ghi lý do và được lưu vào nhật ký hệ thống. Quyền này không cho phép duyệt đề.</p></div>
          <label className="block text-sm font-medium">Lý do hỗ trợ<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Nêu lý do cập nhật nhóm" className={`${fieldClass} mt-1`} /></label>
          {selected && <>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Tên nhóm" className={`${fieldClass} min-w-48 flex-1`} value={name} onChange={(event) => setName(event.target.value)} placeholder={selected.name} />
              <button className={buttonClass} type="button" disabled={saving || name.trim().length < 3} onClick={() => void perform(() => renameReviewGroup(selected.id, name.trim(), reason.trim()), 'Đã đổi tên nhóm.')}>Đổi tên</button>
              <button className={buttonClass} type="button" disabled={saving} onClick={() => void perform(() => setReviewGroupStatus(selected.id, selected.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', reason.trim()), 'Đã cập nhật trạng thái nhóm.')}>{selected.status === 'ACTIVE' ? 'Ngừng nhóm' : 'Kích hoạt nhóm'}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminSelect
                ariaLabel="Giảng viên thêm vào nhóm"
                value={teacherId}
                onChange={setTeacherId}
                options={availableCandidates.map((candidate) => ({ value: candidate.id, label: `${candidate.user.fullName} (${candidate.teacherCode})` }))}
                placeholder="Chọn giảng viên cùng bộ môn"
                disabled={saving || availableCandidates.length === 0}
                className="min-w-48 flex-1"
              />
              <button className={buttonClass} type="button" disabled={saving || !teacherId} onClick={() => void perform(async () => { await addReviewGroupMember(selected.id, teacherId, reason.trim()); setTeacherId('') }, 'Đã thêm thành viên.')}>Thêm thành viên</button>
            </div>
          </>}
          {availableDepartments.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <AdminSelect
              ariaLabel="Bộ môn chưa có nhóm"
              value={departmentId}
              onChange={setDepartmentId}
              options={availableDepartments.map((department) => ({ value: department.id, label: `${department.name} (${department.code})` }))}
              placeholder="Chọn bộ môn chưa có nhóm"
              disabled={saving}
              className="min-w-48 flex-1"
            />
            <input aria-label="Tên nhóm mới" className={`${fieldClass} min-w-48 flex-1`} value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Tên nhóm mới" />
            <button className={buttonClass} type="button" disabled={saving || !departmentId || newGroupName.trim().length < 3} onClick={() => void perform(async () => { await createReviewGroup(departmentId, newGroupName.trim(), reason.trim()); setNewGroupName(''); setDepartmentId('') }, 'Đã tạo nhóm duyệt đề.')}>Tạo nhóm</button>
          </div>}
        </div>}
      </section>
    </div>
  </AdminLayout>
}
