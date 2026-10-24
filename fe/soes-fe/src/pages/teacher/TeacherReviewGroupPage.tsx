import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import * as api from './api/teacher-review-groups.api'

const queryKey = ['teacher', 'review-group']
const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404

export default function TeacherReviewGroupPage() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const groupQuery = useQuery({
    queryKey, queryFn: api.getReviewGroup,
    retry: (count, error) => !isNotFound(error) && count < 1,
  })
  const group = groupQuery.data
  const candidatesQuery = useQuery({
    queryKey: [...queryKey, 'candidates'],
    queryFn: api.listReviewGroupCandidates,
    enabled: Boolean(group?.canManage),
  })
  const [newName, setNewName] = useState('')
  const [editedName, setEditedName] = useState<string | null>(null)
  const [candidateId, setCandidateId] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => Promise<unknown> } | null>(null)

  const perform = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey })
      setEditedName(null)
      setCandidateId('')
      toast.success(successMessage)
    } catch (error) {
      const message = axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Không thể cập nhật nhóm duyệt đề. Vui lòng tải lại và thử lại.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const candidates = (candidatesQuery.data ?? []).filter((candidate) =>
    !group?.members.some((member) => member.teacherId === candidate.id),
  )
  const canCreate = isNotFound(groupQuery.error) && user?.position === 'DEPARTMENT_HEAD'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Nhóm duyệt đề bộ môn"
            description="Nhóm cố định theo bộ môn. Thành viên có thể duyệt đề cuối kỳ sau khi tác giả gửi duyệt."
            icon={<Users size={21} />}
            actions={<button type="button" onClick={() => void groupQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold hover:bg-slate-50"><RefreshCw size={15} /> Tải lại</button>}
          />

          {groupQuery.isLoading && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Đang tải nhóm duyệt đề...</p>}
          {groupQuery.isError && !isNotFound(groupQuery.error) && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Không thể tải nhóm duyệt đề. Hãy thử tải lại.</div>
          )}
          {isNotFound(groupQuery.error) && !canCreate && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Bộ môn của bạn chưa có nhóm duyệt đề. Trưởng bộ môn cần tạo nhóm trước khi gửi đề cuối kỳ.</div>
          )}
          {canCreate && (
            <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Tạo nhóm duyệt đề</h2>
              <p className="mt-1 text-sm text-slate-500">Mỗi bộ môn có một nhóm. Bạn sẽ được thêm làm thành viên khi tạo nhóm.</p>
              <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => {
                event.preventDefault()
                if (newName.trim().length < 3) return
                void perform(() => api.createReviewGroup(newName.trim()), 'Đã tạo nhóm duyệt đề.')
              }}>
                <input aria-label="Tên nhóm duyệt đề" value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={120} placeholder="Tên nhóm duyệt đề" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <button type="submit" disabled={saving || newName.trim().length < 3} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Tạo nhóm</button>
              </form>
            </section>
          )}

          {group && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">{group.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{group.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngừng'}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{group.department.name} · {group.department.code} · {group.members.length} thành viên</p>
                </div>
                {group.canManage && (
                  <button type="button" disabled={saving} onClick={() => setConfirm({
                    title: group.status === 'ACTIVE' ? 'Tạm ngừng nhóm?' : 'Kích hoạt nhóm?',
                    message: group.status === 'ACTIVE' ? 'Không thể tạm ngừng nếu nhóm còn đề đang chờ duyệt.' : 'Thành viên sẽ tiếp tục nhận và duyệt đề sau khi kích hoạt.',
                    action: () => api.setReviewGroupStatus(group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
                  })} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">
                    {group.status === 'ACTIVE' ? 'Tạm ngừng' : 'Kích hoạt'}
                  </button>
                )}
              </div>

              {group.canManage && (
                <div className="grid gap-5 border-b border-slate-100 p-6 lg:grid-cols-2">
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    if ((editedName ?? group.name).trim().length < 3) return
                    void perform(() => api.renameReviewGroup((editedName ?? group.name).trim()), 'Đã đổi tên nhóm.')
                  }}>
                    <label htmlFor="review-group-name" className="mb-2 block text-xs font-semibold text-slate-600">Tên nhóm</label>
                    <div className="flex gap-2">
                      <input id="review-group-name" value={editedName ?? group.name} onChange={(event) => setEditedName(event.target.value)} maxLength={120} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                      <button type="submit" disabled={saving || !editedName?.trim() || editedName.trim() === group.name} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Lưu</button>
                    </div>
                  </form>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    if (!candidateId) return
                    void perform(() => api.addReviewGroupMember(candidateId), 'Đã thêm thành viên vào nhóm.')
                  }}>
                    <label htmlFor="review-group-candidate" className="mb-2 block text-xs font-semibold text-slate-600">Thêm giảng viên cùng bộ môn</label>
                    <div className="flex gap-2">
                      <select id="review-group-candidate" value={candidateId} onChange={(event) => setCandidateId(event.target.value)} disabled={candidatesQuery.isLoading || saving} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <option value="">{candidatesQuery.isLoading ? 'Đang tải giảng viên...' : 'Chọn giảng viên'}</option>
                        {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.user.fullName} ({candidate.teacherCode})</option>)}
                      </select>
                      <button type="submit" disabled={saving || !candidateId} className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Plus size={14} /> Thêm</button>
                    </div>
                    {candidatesQuery.isError && <p className="mt-2 text-xs text-rose-600">Không tải được danh sách giảng viên.</p>}
                  </form>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {group.members.map((member) => (
                  <div key={member.teacherId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"><ShieldCheck size={18} /></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.teacher.user.fullName}</p>
                        <p className="text-xs text-slate-500">{member.teacher.teacherCode}{member.teacher.status !== 'ACTIVE' || member.teacher.user.status !== 'ACTIVE' ? ' · Tài khoản ngừng hoạt động' : ''}</p>
                      </div>
                    </div>
                    {group.canManage && member.teacherId !== user?.profileId && (
                      <button type="button" disabled={saving} onClick={() => setConfirm({
                        title: 'Loại thành viên khỏi nhóm?',
                        message: `${member.teacher.user.fullName} sẽ mất quyền xem và duyệt các đề đang chờ của nhóm.`,
                        action: () => api.removeReviewGroupMember(member.teacherId),
                      })} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14} /> Loại khỏi nhóm</button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {confirm && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="review-group-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="review-group-confirm-title" className="text-base font-semibold text-slate-950">{confirm.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{confirm.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium">Hủy</button>
              <button type="button" disabled={saving} onClick={() => {
                const action = confirm.action
                setConfirm(null)
                void perform(action, 'Đã cập nhật nhóm duyệt đề.')
              }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
