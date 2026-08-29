import { AlertTriangle, CalendarDays, Plus, Star, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import type { AcademicYear } from './types/admin.types'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'
import { useAdminSemesters } from './hooks/useAdminSemesters'

const academicYearOptions = ['2024 - 2025', '2025 - 2026', '2026 - 2027']
const termOptions: Array<{ value: AcademicYear['term']; label: string }> = [
  { value: 1, label: 'Học kỳ 1' },
  { value: 2, label: 'Học kỳ 2' },
  { value: 3, label: 'Học kỳ 3' },
]

export default function AdminAcademicPage() {
  const { items, loading, error, create, activate, retry } = useAdminSemesters()
  const [yearFilter, setYearFilter] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | AcademicYear['status']>('ALL')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025 - 2026')
  const [selectedTerm, setSelectedTerm] = useState<AcademicYear['term']>(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingCurrentSemester, setPendingCurrentSemester] = useState<AcademicYear | null>(null)
  const generatedSemesterCode = createSemesterCode(selectedTerm, selectedAcademicYear)
  const generatedSemesterName = `Học kỳ ${selectedTerm} năm học ${selectedAcademicYear}`

  const handleConfirmSetCurrentSemester = async () => {
    if (!pendingCurrentSemester) return
    try {
      await activate(pendingCurrentSemester.id)
      toast.success(`Đã đặt ${pendingCurrentSemester.name} làm học kỳ hiện tại.`)
      setPendingCurrentSemester(null)
    } catch {
      toast.error('Không thể đổi học kỳ hiện tại. Vui lòng thử lại.')
    }
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
                  { value: 'UPCOMING', label: 'Sắp diễn ra' },
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
        {loading && <p className="py-6 text-center text-sm text-slate-500">Đang tải học kỳ...</p>}
        {error && (
          <div className="py-6 text-center text-sm text-rose-600">
            <p>{error}</p>
            <button type="button" onClick={retry} className="mt-2 text-blue-600">Thử lại</button>
          </div>
        )}
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title="Tạo học kỳ mới"
        description="Quy tắc mã học kỳ: HK + số học kỳ + 2 số cuối của 2 năm (VD: HK12526)."
        confirmText="Tạo học kỳ"
        onClose={() => setModalOpen(false)}
        onConfirm={async () => {
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

          try {
            await create({
              academicYear: selectedAcademicYear.replaceAll(' ', ''),
              term: `TERM_${selectedTerm}` as 'TERM_1' | 'TERM_2' | 'TERM_3',
              startDate,
              endDate,
            })
            setModalOpen(false)
            toast.success(`Đã tạo ${generatedSemesterName}.`)
          } catch {
            toast.error('Không thể tạo học kỳ. Vui lòng kiểm tra dữ liệu hoặc mã học kỳ trùng.')
          }
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

          <div className="grid grid-cols-1 gap-4">
            <AdminField label="Mã học kỳ (hệ thống tự sinh)">
              <AdminInput value={generatedSemesterCode} disabled />
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
    UPCOMING: 'Sắp diễn ra',
    ACTIVE: 'Đang mở',
    CLOSED: 'Đã đóng',
  }
  const toneMap: Record<AcademicYear['status'], 'emerald' | 'amber' | 'gray'> = {
    UPCOMING: 'gray',
    ACTIVE: 'emerald',
    CLOSED: 'amber',
  }
  return <AppBadge tone={toneMap[status]}>{labelMap[status]}</AppBadge>
}

function createSemesterCode(term: AcademicYear['term'], academicYear: string) {
  const parts = academicYear.split('-').map((part) => part.trim().slice(-2))
  return `HK${term}${parts.join('')}`
}
