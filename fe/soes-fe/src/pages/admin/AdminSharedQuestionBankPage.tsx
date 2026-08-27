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
import { ADMIN_DEPARTMENTS, ADMIN_SHARED_QUESTIONS, ADMIN_SUBJECTS } from './mock/admin.mock'
import type { SharedQuestionAdmin } from './types/admin.types'

export default function AdminSharedQuestionBankPage() {
  const [items, setItems] = useState<SharedQuestionAdmin[]>(ADMIN_SHARED_QUESTIONS)
  const [department, setDepartment] = useState('ALL')
  const [subject, setSubject] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | SharedQuestionAdmin['status']>('APPROVED')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<SharedQuestionAdmin | null>(null)
  const [removing, setRemoving] = useState<SharedQuestionAdmin | null>(null)
  const [removeReason, setRemoveReason] = useState('Gỡ tạm thời để xử lý vấn đề vận hành.')

  const subjectsByCode = useMemo(() => new Map(ADMIN_SUBJECTS.map((item) => [item.code, item])), [])
  const visibleSubjects = useMemo(
    () => ADMIN_SUBJECTS.filter((item) => department === 'ALL' || item.departmentId === department),
    [department],
  )

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchedSubject = subjectsByCode.get(item.subjectCode)
        const matchesDepartment = department === 'ALL' || matchedSubject?.departmentId === department
        const matchesSubject = subject === 'ALL' || item.subjectCode === subject
        const matchesStatus = status === 'ALL' || item.status === status
        const matchesSearch =
          item.content.toLowerCase().includes(search.toLowerCase()) ||
          item.contributorName.toLowerCase().includes(search.toLowerCase()) ||
          item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
          Boolean(matchedSubject?.name.toLowerCase().includes(search.toLowerCase()))
        return matchesDepartment && matchesSubject && matchesStatus && matchesSearch
      }),
    [department, items, search, status, subject, subjectsByCode],
  )

  const removeFromSharedBank = (item: SharedQuestionAdmin, reason: string) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? {
              ...row,
              status: 'REMOVED',
              removedBy: 'Trần Quang Huy',
              removedAt: 'Hôm nay',
              removalReason: reason,
            }
          : row,
      ),
    )
    toast.success('Đã gỡ câu hỏi khỏi ngân hàng dùng chung.')
  }

  const restoreToSharedBank = (item: SharedQuestionAdmin) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? {
              ...row,
              status: 'APPROVED',
              removedBy: undefined,
              removedAt: undefined,
              removalReason: undefined,
            }
          : row,
      ),
    )
    toast.success('Đã khôi phục câu hỏi vào ngân hàng dùng chung.')
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Database size={20} />}
        title="Kho Câu Hỏi Dùng Chung Toàn Trường"
        description="Tra cứu các câu hỏi đã được Trưởng bộ môn duyệt vào ngân hàng chung và xử lý gỡ câu hỏi khi có sự cố."
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm nội dung câu hỏi hoặc giảng viên đóng góp..."
          onReset={() => {
            setSearch('')
            setDepartment('ALL')
            setSubject('ALL')
            setStatus('ALL')
          }}
          filters={
            <>
              <AdminSelect
                value={department}
                onChange={(val) => {
                  setDepartment(val)
                  setSubject('ALL')
                }}
                className="w-56"
                options={[
                  { value: 'ALL', label: 'Tất cả bộ môn' },
                  ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
              <AdminSelect
                value={subject}
                onChange={setSubject}
                className="w-56"
                options={[
                  { value: 'ALL', label: 'Tất cả môn học' },
                  ...visibleSubjects.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
                ]}
              />
              <AdminSelect
                value={status}
                onChange={(val) => setStatus(val as 'ALL' | SharedQuestionAdmin['status'])}
                className="w-44"
                options={[
                  { value: 'ALL', label: 'Trạng thái' },
                  { value: 'APPROVED', label: 'Đang dùng chung' },
                  { value: 'REMOVED', label: 'Đã gỡ' },
                ]}
              />
            </>
          }
        />

        <SharedQuestionTable
          items={filteredItems}
          subjectsByCode={subjectsByCode}
          onView={setViewing}
          onRemove={(item) => {
            setRemoving(item)
            setRemoveReason('Gỡ tạm thời để xử lý vấn đề vận hành.')
          }}
          onRestore={restoreToSharedBank}
        />
      </AdminTablePanel>

      <SharedQuestionDetailModal
        question={viewing}
        subjectsByCode={subjectsByCode}
        onClose={() => setViewing(null)}
      />

      <SharedQuestionRemoveDialog
        question={removing}
        reason={removeReason}
        onReasonChange={setRemoveReason}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing || removeReason.trim().length < 5) {
            toast.error('Vui lòng nhập lý do gỡ câu hỏi ít nhất 5 ký tự.')
            return
          }
          removeFromSharedBank(removing, removeReason.trim())
          setRemoving(null)
        }}
      />
    </AdminLayout>
  )
}
