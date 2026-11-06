import type { ApiPagination } from '../../types/admin-api.types'
import type { AdminExamSchedule, AdminSubject, Department } from '../../types/admin.types'
import AdminPagination from '../AdminPagination'
import AdminSelect from '../AdminSelect'
import AdminToolbar from '../AdminToolbar'
import ScheduleListItem from './ScheduleListItem'

export interface ScheduleFilters {
  keyword: string
  departmentId: string
  subjectId: string
  status: string
}

export default function ScheduledExamsPanel({
  items, departments, subjects, pagination, loading, error, canManage, filters,
  onFiltersChange, onReset, onRetry, onPageChange, onEdit, onCancel,
}: {
  items: AdminExamSchedule[]
  departments: Department[]
  subjects: AdminSubject[]
  pagination: ApiPagination
  loading: boolean
  error: string | null
  canManage: boolean
  filters: ScheduleFilters
  onFiltersChange: (patch: Partial<ScheduleFilters>) => void
  onReset: () => void
  onRetry: () => void
  onPageChange: (page: number) => void
  onEdit: (item: AdminExamSchedule) => void
  onCancel: (item: AdminExamSchedule) => void
}) {
  const visibleSubjects = subjects.filter((subject) => !filters.departmentId || subject.departmentId === filters.departmentId)

  return <section role="tabpanel" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-6 py-5">
      <h2 className="text-base font-semibold text-slate-900">Các ca thi tập trung</h2>
      <p className="mt-1 text-sm text-slate-500">Theo dõi thời gian, lớp tham gia và giảng viên coi thi của từng ca.</p>
    </div>
    <AdminToolbar searchValue={filters.keyword}
      onSearchChange={(keyword) => onFiltersChange({ keyword })}
      searchPlaceholder="Tìm theo đề thi hoặc ca thi..." onReset={onReset}
      filters={<>
        <AdminSelect value={filters.departmentId} className="w-full sm:w-52 xl:w-48 2xl:w-60"
          onChange={(value) => onFiltersChange({ departmentId: String(value), subjectId: '' })}
          placeholder="Bộ môn" options={[{ value: '', label: 'Tất cả bộ môn' }, ...departments.map((item) => ({ value: item.id, label: item.name }))]} />
        <AdminSelect value={filters.subjectId} className="w-full sm:w-52 xl:w-48 2xl:w-60"
          onChange={(value) => onFiltersChange({ subjectId: String(value) })}
          placeholder="Môn học" options={[{ value: '', label: 'Tất cả môn học' }, ...visibleSubjects.map((item) => ({ value: item.id, label: item.name }))]} />
        <AdminSelect value={filters.status} className="w-full sm:w-52 xl:w-44 2xl:w-56"
          onChange={(value) => onFiltersChange({ status: String(value) })}
          placeholder="Trạng thái" options={[
            { value: '', label: 'Tất cả trạng thái' }, { value: 'SCHEDULED', label: 'Đã lên lịch' },
            { value: 'OPEN', label: 'Đang mở' }, { value: 'CLOSED', label: 'Đã đóng' },
            { value: 'CANCELLED', label: 'Đã hủy' },
          ]} />
      </>} />
    {loading ? <div className="px-6 py-10 text-center text-sm text-slate-500">Đang tải lịch thi...</div>
      : error ? <div className="px-6 py-10 text-center text-sm text-rose-600">
        <p>{error}</p><button type="button" className="mt-3 text-emerald-700 underline" onClick={onRetry}>Thử lại</button>
      </div>
        : items.length ? items.map((item) => <ScheduleListItem key={item.id} item={item} canManage={canManage}
          onEdit={() => onEdit(item)} onCancel={() => onCancel(item)} />)
          : <div className="px-6 py-10 text-center text-sm text-slate-500">Chưa có lịch thi tập trung.</div>}
    {!loading && !error && <AdminPagination page={pagination.page} pageSize={pagination.pageSize}
      totalPages={pagination.totalPages} totalItems={pagination.totalItems} onChange={onPageChange} />}
  </section>
}
