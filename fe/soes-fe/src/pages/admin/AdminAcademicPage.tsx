import { AlertTriangle, Archive, CalendarDays, Edit, Plus, Star, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_ACADEMIC_YEARS } from './mock/admin.mock'
import type { AcademicYear } from './types/admin.types'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

const academicYearOptions = ['2024 - 2025', '2025 - 2026', '2026 - 2027']
const termOptions: Array<{ value: AcademicYear['term']; label: string }> = [
  { value: 1, label: 'Học kỳ 1' },
  { value: 2, label: 'Học kỳ 2' },
  { value: 3, label: 'Học kỳ 3' },
]

export default function AdminAcademicPage() {
  const [items, setItems] = useState<AcademicYear[]>(ADMIN_ACADEMIC_YEARS)
  const [yearFilter, setYearFilter] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | AcademicYear['status']>('ALL')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025 - 2026')
  const [selectedTerm, setSelectedTerm] = useState<AcademicYear['term']>(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [modalStatus, setModalStatus] = useState<AcademicYear['status']>('ACTIVE')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingCurrentSemester, setPendingCurrentSemester] = useState<AcademicYear | null>(null)
  const generatedSemesterCode = createSemesterCode(selectedTerm, selectedAcademicYear)
  const generatedSemesterName = `Học kỳ ${selectedTerm} năm học ${selectedAcademicYear}`

  const handleConfirmSetCurrentSemester = () => {
    if (!pendingCurrentSemester) return

    setItems((prev) => prev.map((row) => ({
      ...row,
      isCurrent: row.id === pendingCurrentSemester.id,
      status: row.id === pendingCurrentSemester.id ? 'ACTIVE' : row.status,
    })))
    toast.success(`Đã đặt ${pendingCurrentSemester.name} làm học kỳ hiện tại.`)
    setPendingCurrentSemester(null)
  }

  const filteredItems = items.filter((item) => {
    const matchesYear = yearFilter === 'ALL' || item.academicYear === yearFilter
    const matchesStatus = status === 'ALL' || item.status === status
    const keyword = search.toLowerCase()
    const matchesSearch =
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword)
    return matchesYear && matchesStatus && matchesSearch
  })

  const columns: ColumnDef<AcademicYear>[] = [
    {
      header: 'TÊN HỌC KỲ',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{item.name}</p>
            <span className="inline-flex w-[74px] shrink-0">
              {item.isCurrent ? <AppBadge tone="emerald">Hiện tại</AppBadge> : null}
            </span>
          </div>
          <p className="text-xs text-slate-400">{item.code} • {item.academicYear}</p>
        </div>
      ),
    },
    {
      header: 'THỜI GIAN',
      width: '260px',
      render: (item) => <span className="text-sm text-slate-700">{item.startDate} → {item.endDate}</span>,
    },
    {
      header: 'TRẠNG THÁI',
      width: '150px',
      render: (item) => <AcademicStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className={`rounded-lg p-1.5 transition-colors hover:bg-emerald-50 hover:text-emerald-600 ${
              item.isCurrent ? 'text-emerald-600' : ''
            }`}
            title={item.isCurrent ? 'Học kỳ hiện tại' : 'Đặt làm học kỳ hiện tại'}
            onClick={() => {
              if (item.isCurrent) return
              setPendingCurrentSemester(item)
            }}
          >
            <Star size={17} fill="none" />
          </button>
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Chỉnh sửa" onClick={() => setModalOpen(true)}><Edit size={17} /></button>
          <button
            disabled={item.isCurrent}
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            title={item.isCurrent ? 'Không lưu trữ học kỳ hiện tại' : 'Lưu trữ'}
            onClick={() => setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'ARCHIVED' } : row))}
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
        icon={<CalendarDays size={20} />}
        title="Học kỳ và Năm học"
        description="Quản lý mã học kỳ, thời gian học vụ, trạng thái mở/đóng và thiết lập học kỳ hiện tại."
        action={<AdminButton icon={<Plus size={17} />} onClick={() => setModalOpen(true)}>Thêm học kỳ</AdminButton>}
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo mã hoặc tên học kỳ..."
          onReset={() => {
            setSearch('')
            setYearFilter('ALL')
            setStatus('ALL')
          }}
          filters={(
            <>
              <AdminSelect value={yearFilter} onChange={setYearFilter} className="w-56" options={[
                { value: 'ALL', label: 'Năm học' },
                ...academicYearOptions.map((year) => ({ value: year, label: `Năm học ${year}` })),
              ]} />
              <AdminSelect value={status} onChange={setStatus} className="w-44" options={[
                { value: 'ALL', label: 'Trạng thái' },
                { value: 'ACTIVE', label: 'Đang mở' },
                { value: 'CLOSED', label: 'Đã đóng' },
                { value: 'ARCHIVED', label: 'Đã lưu trữ' },
              ]} />
            </>
          )}
        />
        <DataTable columns={columns} data={filteredItems} keyExtractor={(item) => item.id} emptyText="Chưa có học kỳ phù hợp." />
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title="Thêm học kỳ mới"
        description="Thiết lập thông tin học kỳ. Giữa kỳ do giảng viên tự tổ chức trong lớp, cuối kỳ tập trung được tạo ở Lịch thi và Phân công."
        confirmText="Lưu học kỳ"
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          const isDuplicate = items.some((item) => item.code === generatedSemesterCode)
          if (isDuplicate) {
            toast.error('Học kỳ này đã tồn tại trong năm học đã chọn.')
            return
          }

          setItems((prev) => [
            ...prev,
            {
              id: `ay-${generatedSemesterCode.toLowerCase()}`,
              code: generatedSemesterCode,
              name: generatedSemesterName,
              academicYear: selectedAcademicYear,
              term: selectedTerm,
              startDate: formatDateForDisplay(startDate),
              endDate: formatDateForDisplay(endDate),
              status: modalStatus,
            },
          ])
          setModalOpen(false)
          toast.success('Đã lưu học kỳ mới.')
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Năm học">
            <AdminSelect
              value={selectedAcademicYear}
              onChange={setSelectedAcademicYear}
              options={academicYearOptions.map((year) => ({ value: year, label: `Năm học ${year}` }))}
            />
          </AdminField>
          <AdminField label="Học kỳ">
            <AdminSelect
              value={selectedTerm}
              onChange={setSelectedTerm}
              options={termOptions}
            />
          </AdminField>
          <AdminField label="Mã học kỳ">
            <AdminInput value={generatedSemesterCode} readOnly className="bg-gray-50 text-slate-500" />
          </AdminField>
          <AdminField label="Tên học kỳ">
            <AdminInput value={generatedSemesterName} readOnly className="bg-gray-50 text-slate-500" />
          </AdminField>
          <AdminField label="Ngày bắt đầu">
            <AdminInput type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </AdminField>
          <AdminField label="Ngày kết thúc">
            <AdminInput type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </AdminField>
          <AdminField label="Trạng thái">
            <AdminSelect
              value={modalStatus}
              onChange={setModalStatus}
              options={[
                { value: 'ACTIVE', label: 'Đang mở' },
                { value: 'CLOSED', label: 'Đã đóng' },
                { value: 'ARCHIVED', label: 'Đã lưu trữ' },
              ]}
            />
          </AdminField>
        </div>
      </AdminModal>

      <CurrentSemesterConfirmDialog
        semester={pendingCurrentSemester}
        onClose={() => setPendingCurrentSemester(null)}
        onConfirm={handleConfirmSetCurrentSemester}
      />
    </AdminLayout>
  )
}

function AcademicStatusBadge({ status }: { status: AcademicYear['status'] }) {
  const statusConfig = {
    ACTIVE: { tone: 'emerald', label: 'Đang mở' },
    CLOSED: { tone: 'gray', label: 'Đã đóng' },
    ARCHIVED: { tone: 'gray', label: 'Đã lưu trữ' },
  } as const

  const config = statusConfig[status]
  return <AppBadge tone={config.tone}>{config.label}</AppBadge>
}

function createSemesterCode(term: AcademicYear['term'], academicYear: string) {
  const endYear = academicYear.split('-').at(-1)?.trim() ?? academicYear
  return `HK${term}_${endYear}`
}

function formatDateForDisplay(date: string) {
  if (!date) return 'Chưa thiết lập'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function CurrentSemesterConfirmDialog({
  semester,
  onClose,
  onConfirm,
}: {
  semester: AcademicYear | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!semester) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Đặt làm học kỳ hiện tại</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-4 px-6 py-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle size={22} />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Bạn có chắc muốn chọn <span className="font-semibold text-slate-800">{semester.name}</span> làm học kỳ hiện tại?
            Học kỳ hiện tại trước đó sẽ được bỏ chọn.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Hủy</AdminButton>
          <AdminButton onClick={onConfirm}>Xác nhận</AdminButton>
        </div>
      </div>
    </div>
  )
}
