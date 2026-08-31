import { Database } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'
import SharedQuestionDetailModal from './components/shared-question-bank/SharedQuestionDetailModal'
import SharedQuestionRemoveDialog from './components/shared-question-bank/SharedQuestionRemoveDialog'
import SharedQuestionTable from './components/shared-question-bank/SharedQuestionTable'
import { useAdminQuestionBank } from './hooks/useAdminContent'
import { useAdminStructure } from './hooks/useAdminStructure'
import type { SharedQuestionAdmin } from './types/admin.types'

export default function AdminSharedQuestionBankPage() {
  const [page, setPage] = useState(1)
  const [department, setDepartment] = useState('ALL')
  const [subject, setSubject] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | SharedQuestionAdmin['status']>('APPROVED')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<SharedQuestionAdmin | null>(null)
  const [removing, setRemoving] = useState<SharedQuestionAdmin | null>(null)
  const [removeReason, setRemoveReason] = useState('Gỡ tạm thời để xử lý vấn đề vận hành.')
  const structure = useAdminStructure()
  const bank = useAdminQuestionBank({
    page, pageSize: 10, keyword: search || undefined,
    departmentId: department === 'ALL' ? undefined : department,
    subjectId: subject === 'ALL' ? undefined : subject,
    status: status === 'ALL' ? undefined : status,
  })
  const subjectsByCode = useMemo(() => new Map(
    structure.subjects.map((item) => [item.code, item]),
  ), [structure.subjects])
  const visibleSubjects = useMemo(() => structure.subjects.filter(
    (item) => department === 'ALL' || item.departmentId === department,
  ), [department, structure.subjects])
  const reset = () => { setPage(1); setSearch(''); setDepartment('ALL'); setSubject('ALL'); setStatus('ALL') }
  const restore = async (item: SharedQuestionAdmin) => {
    try { await bank.restore(item.id); toast.success('Đã khôi phục câu hỏi vào ngân hàng dùng chung.') }
    catch { toast.error('Không thể khôi phục câu hỏi. Vui lòng thử lại.') }
  }

  return <AdminLayout>
    <AdminPageHeader icon={<Database size={20} />} title="Kho câu hỏi dùng chung toàn trường"
      description="Tra cứu câu hỏi đã duyệt và xử lý gỡ tạm thời vì lý do vận hành; Admin không duyệt nội dung học thuật." />
    <AdminTablePanel>
      <AdminToolbar searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1) }}
        searchPlaceholder="Tìm nội dung câu hỏi hoặc giảng viên đóng góp..." onReset={reset}
        filters={<>
          <AdminSelect value={department} className="w-56" onChange={(value) => {
            setDepartment(value); setSubject('ALL'); setPage(1)
          }} options={[{ value: 'ALL', label: 'Tất cả bộ môn' }, ...structure.departments.map(({ id, name }) => ({ value: id, label: name }))]} />
          <AdminSelect value={subject} className="w-56" onChange={(value) => { setSubject(value); setPage(1) }}
            options={[{ value: 'ALL', label: 'Tất cả môn học' }, ...visibleSubjects.map(({ id, code, name }) => ({ value: id, label: `${code} - ${name}` }))]} />
          <AdminSelect value={status} className="w-44" onChange={(value) => { setStatus(value as typeof status); setPage(1) }}
            options={[{ value: 'ALL', label: 'Trạng thái' }, { value: 'APPROVED', label: 'Đang dùng chung' }, { value: 'REMOVED', label: 'Đã gỡ' }]} />
        </>} />
      <SharedQuestionTable
        items={bank.items}
        subjectsByCode={subjectsByCode}
        onView={setViewing}
        onRemove={(item) => {
          setRemoving(item)
          setRemoveReason('Gỡ tạm thời để xử lý vấn đề vận hành.')
        }}
        onRestore={(item) => {
          void restore(item)
        }}
        page={page}
        pageSize={10}
        totalItems={bank.pagination.totalItems}
        totalPages={bank.pagination.totalPages}
        onPageChange={setPage}
      />
    </AdminTablePanel>
    <SharedQuestionDetailModal question={viewing} subjectsByCode={subjectsByCode} onClose={() => setViewing(null)} />
    <SharedQuestionRemoveDialog question={removing} reason={removeReason} onReasonChange={setRemoveReason}
      onClose={() => setRemoving(null)} onConfirm={() => {
        if (!removing || removeReason.trim().length < 5) return toast.error('Vui lòng nhập lý do ít nhất 5 ký tự.')
        void bank.remove(removing.id, removeReason.trim()).then(() => {
          setRemoving(null); toast.success('Đã gỡ câu hỏi khỏi ngân hàng dùng chung.')
        }).catch(() => toast.error('Không thể gỡ câu hỏi. Vui lòng thử lại.'))
      }} />
  </AdminLayout>
}
