import { AlertTriangle, Archive, CalendarDays, Plus, Star, X } from 'lucide-react'
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

    setItems((prev) =>
      prev.map((row) => ({
        ...row,
        isCurrent: row.id === pendingCurrentSemester.id,
        status: row.id === pendingCurrentSemester.id ? 'ACTIVE' : row.status,
      })),
    )
    toast.success(`Đã đặt ${pendingCurrentSemester.name} làm học kỳ hiện tại.`)
    setPendingCurrentSemester(null)
  }

  const filteredItems = items.filter((item) => {
    const matchesYear = yearFilter === 'ALL' || item.academicYear === yearFilter
    const matchesStatus = status === 'ALL' || item.status === status
    const keyword = search.toLowerCase()
    const matchesSearch =
      item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword)
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
          <p className="text-xs text-slate-400">
            {item.code} • {item.academicYear}
          </p>
        </div>
      ),
    },
    {
      header: 'THỜI GIAN',
      width: '260px',
      render: (item) => (
        <span className="text-sm text-slate-700">
          {item.startDate} → {item.endDate}
        </span>
      ),
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
            className={`rounded-lg p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-500 ${
              item.isCurrent ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
            }`}
            title={item.isCurrent ? 'Học kỳ hiện tại' : 'Đặt làm học kỳ hiện tại'}
            onClick={() => {
              if (item.isCurrent) return
              setPendingCurrentSemester(item)
            }}
          >
            <Star size={17} fill="none" />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700"
            title="Lưu trữ"
            onClick={() => {
              if (item.status === 'ARCHIVED') {
                toast.info(`${item.name} đã ở trạng thái lưu trữ.`)
                return
              }
              setItems((prev) =>
                prev.map((row) => (row.id === item.id ? { ...row, status: 'ARCHIVED' } : row)),
              )
              toast.success(`Đã lưu trữ ${item.name}.`)
            }}
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
        title="Năm học và Học kỳ"
        description="Quản lý các đợt học kỳ, kích hoạt học kỳ hiện tại và thiết lập thời gian biểu."
        action={
          <AdminButton
            icon={<Plus size={17} />}
            onClick={() => {
              setStartDate('')
              setEndDate('')
              setModalStatus('ACTIVE')
              setModalOpen(true)
            }}
          >
            Tạo học kỳ mới
          </AdminButton>
        }
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
          filters={
            <>
              <AdminSelect
                value={yearFilter}
                onChange={setYearFilter}
                className="w-48"
                options={[
                  { value: 'ALL', label: 'Tất cả năm học' },
                  ...academicYearOptions.map((year) => ({ value: year, label: year })),
                ]}
              />
              <AdminSelect
                value={status}
                onChange={setStatus}
                className="w-44"
                options={[
                  { value: 'ALL', label: 'Trạng thái' },
                  { value: 'ACTIVE', label: 'Đang mở' },
                  { value: 'CLOSED', label: 'Đã đóng' },
                  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
                ]}
              />
            </>
          }
        />
        <DataTable
          columns={columns}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          emptyText="Chưa có học kỳ phù hợp."
        />
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title="Tạo học kỳ mới"
        description="Quy tắc mã học kỳ: HK + số học kỳ + 2 số cuối của 2 năm (VD: HK12526)."
        confirmText="Tạo học kỳ"
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          if (!startDate || !endDate) {
            toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc.')
            return
          }
          if (new Date(startDate) > new Date(endDate)) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc.')
            return
          }
          if (items.some((item) => item.code === generatedSemesterCode)) {
            toast.error(`Học kỳ ${generatedSemesterCode} đã tồn tại.`)
            return
          }

          setItems((prev) => [
            ...prev,
            {
              id: createEntityId('sem', generatedSemesterCode),
              name: generatedSemesterName,
              code: generatedSemesterCode,
              academicYear: selectedAcademicYear,
              term: selectedTerm,
              startDate,
              endDate,
              isCurrent: false,
              status: modalStatus,
            },
          ])
          setModalOpen(false)
          toast.success(`Đã tạo ${generatedSemesterName}.`)
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Năm học">
              <AdminSelect
                value={selectedAcademicYear}
                onChange={setSelectedAcademicYear}
                options={academicYearOptions.map((year) => ({ value: year, label: year }))}
              />
            </AdminField>
            <AdminField label="Học kỳ">
              <AdminSelect
                value={String(selectedTerm)}
                onChange={(value) => setSelectedTerm(Number(value) as AcademicYear['term'])}
                options={termOptions.map((term) => ({ value: String(term.value), label: term.label }))}
              />
            </AdminField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Mã học kỳ (hệ thống tự sinh)">
              <AdminInput value={generatedSemesterCode} disabled />
            </AdminField>
            <AdminField label="Trạng thái">
              <AdminSelect
                value={modalStatus}
                onChange={(value) => setModalStatus(value as AcademicYear['status'])}
                options={[
                  { value: 'ACTIVE', label: 'Đang mở' },
                  { value: 'CLOSED', label: 'Đã đóng' },
                ]}
              />
            </AdminField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Ngày bắt đầu">
              <AdminInput type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </AdminField>
            <AdminField label="Ngày kết thúc">
              <AdminInput type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </AdminField>
          </div>
        </div>
      </AdminModal>

      <SetCurrentSemesterConfirm
        semester={pendingCurrentSemester}
        onClose={() => setPendingCurrentSemester(null)}
        onConfirm={handleConfirmSetCurrentSemester}
      />
    </AdminLayout>
  )
}

function SetCurrentSemesterConfirm({
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
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
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

        <div className="flex items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle size={23} />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Đặt <span className="font-semibold text-slate-900">{semester.name}</span> làm học kỳ hiện tại?
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton onClick={onConfirm}>Xác nhận</AdminButton>
        </div>
      </div>
    </div>
  )
}

function AcademicStatusBadge({ status }: { status: AcademicYear['status'] }) {
  const labelMap: Record<AcademicYear['status'], string> = {
    ACTIVE: 'Đang mở',
    CLOSED: 'Đã đóng',
    ARCHIVED: 'Đã lưu trữ',
  }
  const toneMap: Record<AcademicYear['status'], 'emerald' | 'amber' | 'gray'> = {
    ACTIVE: 'emerald',
    CLOSED: 'amber',
    ARCHIVED: 'gray',
  }
  return <AppBadge tone={toneMap[status]}>{labelMap[status]}</AppBadge>
}

function createSemesterCode(term: AcademicYear['term'], academicYear: string) {
  const parts = academicYear.split('-').map((part) => part.trim().slice(-2))
  return `HK${term}${parts.join('')}`
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
