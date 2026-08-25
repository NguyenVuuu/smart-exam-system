import { Archive, Database, Eye, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_DEPARTMENTS, ADMIN_SHARED_QUESTIONS, ADMIN_SUBJECTS } from './mock/admin.mock'
import type { SharedQuestionAdmin } from './types/admin.types'
import { QuestionStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

const typeLabel: Record<SharedQuestionAdmin['type'], string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

const difficultyTone = {
  EASY: 'emerald',
  MEDIUM: 'amber',
  HARD: 'rose',
} as const

const difficultyLabel: Record<SharedQuestionAdmin['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const questionDetails: Record<string, {
  options?: Array<{ label: string; content: string; correct?: boolean }>
  explanation: string
  extra?: string
}> = {
  'sq-1': {
    options: [
      { label: 'A', content: 'new ClassName()', correct: true },
      { label: 'B', content: 'ClassName obj = new ClassName()', correct: true },
      { label: 'C', content: 'ClassName()' },
      { label: 'D', content: 'Class.forName(...).newInstance()', correct: true },
    ],
    explanation: 'Khởi tạo đối tượng cần từ khóa new hoặc sử dụng reflection.',
  },
  'sq-2': {
    explanation: 'Bài lập trình kiểm tra số nguyên tố bằng cách thử ước từ 2 đến căn bậc hai của n.',
    extra: 'Java • 3 test case • Time limit 1000ms • Memory 128MB',
  },
  'sq-3': {
    options: [
      { label: 'A', content: 'Đúng', correct: true },
      { label: 'B', content: 'Sai' },
    ],
    explanation: 'Trong Java, kiểu int là số nguyên 32 bit có dấu.',
  },
}

export default function AdminSharedQuestionBankPage() {
  const [items, setItems] = useState<SharedQuestionAdmin[]>(ADMIN_SHARED_QUESTIONS)
  const [department, setDepartment] = useState('ALL')
  const [subject, setSubject] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | SharedQuestionAdmin['status']>('ALL')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<SharedQuestionAdmin | null>(null)

  const subjectsByCode = useMemo(() => new Map(ADMIN_SUBJECTS.map((item) => [item.code, item])), [])
  const visibleSubjects = useMemo(
    () => ADMIN_SUBJECTS.filter((item) => department === 'ALL' || item.departmentId === department),
    [department],
  )

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchedSubject = subjectsByCode.get(item.subjectCode)
    const matchesDepartment = department === 'ALL' || matchedSubject?.departmentId === department
    const matchesSubject = subject === 'ALL' || item.subjectCode === subject
    const matchesStatus = status === 'ALL' || item.status === status
    const matchesSearch =
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.contributorName.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      matchedSubject?.name.toLowerCase().includes(search.toLowerCase())
    return matchesDepartment && matchesSubject && matchesStatus && matchesSearch
  }), [department, items, search, status, subject, subjectsByCode])

  const columns: ColumnDef<SharedQuestionAdmin>[] = [
    {
      header: 'NỘI DUNG',
      render: (item) => (
        <div className="min-w-0 max-w-[520px] space-y-1">
          <p className="truncate text-sm font-semibold text-slate-950">{item.content}</p>
          <p className="text-xs text-slate-400">{subjectsByCode.get(item.subjectCode)?.name ?? item.subjectCode}</p>
        </div>
      ),
    },
    { header: 'LOẠI', width: '160px', render: (item) => <AppBadge tone={item.type === 'PROGRAMMING' ? 'emerald' : 'blue'}>{typeLabel[item.type]}</AppBadge> },
    { header: 'ĐỘ KHÓ', width: '130px', render: (item) => <AppBadge tone={difficultyTone[item.difficulty]}>{difficultyLabel[item.difficulty]}</AppBadge> },
    { header: 'NGƯỜI ĐÓNG GÓP', width: '190px', render: (item) => <span className="text-sm text-slate-700">{item.contributorName}</span> },
    { header: 'TRẠNG THÁI', width: '140px', render: (item) => <QuestionStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Xem câu hỏi" onClick={() => setViewing(item)}><Eye size={17} /></button>
          <button
            className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"
            title="Gỡ khỏi ngân hàng chung"
            onClick={() => setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'REMOVED' } : row))}
          >
            <Archive size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Database size={20} />}
        title="Ngân hàng câu hỏi chung"
        description="Giám sát vận hành ngân hàng câu hỏi dùng chung theo môn. Admin không sửa hoặc duyệt nội dung học thuật thay Trưởng bộ môn."
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo nội dung câu hỏi..."
          onReset={() => {
            setSearch('')
            setDepartment('ALL')
            setSubject('ALL')
            setStatus('ALL')
          }}
          filters={(
            <>
              <AdminSelect
                value={department}
                onChange={(value) => {
                  setDepartment(value)
                  setSubject('ALL')
                }}
                className="w-60"
                options={[
                  { value: 'ALL', label: 'Bộ môn' },
                  ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
              <AdminSelect value={subject} onChange={setSubject} className="w-56" options={[
                { value: 'ALL', label: 'Môn học' },
                ...visibleSubjects.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
              ]} />
              <AdminSelect value={status} onChange={setStatus} className="w-48" options={[
                { value: 'ALL', label: 'Trạng thái duyệt' },
                { value: 'APPROVED', label: 'Đã duyệt' },
                { value: 'REMOVED', label: 'Đã gỡ' },
              ]} />
            </>
          )}
        />
        <DataTable columns={columns} data={filteredItems} keyExtractor={(item) => item.id} emptyText="Chưa có câu hỏi chung phù hợp." />
      </AdminTablePanel>

      <QuestionDetailModal question={viewing} onClose={() => setViewing(null)} />
    </AdminLayout>
  )
}

function QuestionDetailModal({
  question,
  onClose,
}: {
  question: SharedQuestionAdmin | null
  onClose: () => void
}) {
  if (!question) return null

  const detail = questionDetails[question.id] ?? {
    explanation: 'Câu hỏi đã được duyệt vào ngân hàng chung và sẵn sàng dùng khi tạo đề.',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Xem câu hỏi</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AppBadge tone={question.type === 'PROGRAMMING' ? 'emerald' : 'blue'}>{typeLabel[question.type]}</AppBadge>
            <AppBadge tone={difficultyTone[question.difficulty]}>{difficultyLabel[question.difficulty]}</AppBadge>
            <AppBadge tone="gray">{question.subjectCode}</AppBadge>
          </div>

          <p className="text-sm leading-6 text-slate-800">{question.content}</p>

          {detail.extra && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {detail.extra}
            </div>
          )}

          {detail.options && (
            <div className="mt-5 space-y-2">
              {detail.options.map((option) => (
                <div
                  key={option.label}
                  className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                    option.correct
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-gray-100 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500">
                      {option.label}
                    </span>
                    <span className="truncate">{option.content}</span>
                  </div>
                  {option.correct && <span className="shrink-0 text-xs font-semibold text-emerald-700">Đáp án đúng</span>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700">Giải thích</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{detail.explanation}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate-600 md:grid-cols-2">
            <p>Người đóng góp: <span className="font-semibold text-slate-800">{question.contributorName}</span></p>
            <p>Duyệt bởi: <span className="font-semibold text-slate-800">{question.reviewedBy}</span></p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Đóng</AdminButton>
        </div>
      </div>
    </div>
  )
}
