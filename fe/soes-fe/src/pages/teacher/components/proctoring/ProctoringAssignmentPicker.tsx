import { CalendarClock, RefreshCw } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { ProctorAssignmentApiDto, TeacherPage } from '../../types/teacher-course-api.types'
import TeacherPagination from '../TeacherPagination'
import TeacherTablePanel from '../TeacherTablePanel'
import TeacherToolbar from '../TeacherToolbar'
import ProctorAssignmentAction from './ProctorAssignmentAction'

interface ProctoringAssignmentPickerProps {
  assignments: ProctorAssignmentApiDto[]
  pagination: TeacherPage<never>['pagination']
  searchQuery: string
  loading: boolean
  error: string | null
  onSearchChange: (query: string) => void
  onPageChange: (page: number) => void
  onReset: () => void
  onRetry: () => void
  onOpen: (assignment: ProctorAssignmentApiDto) => void
}

export default function ProctoringAssignmentPicker(props: ProctoringAssignmentPickerProps) {
  if (props.error) return <AssignmentError message={props.error} onRetry={props.onRetry} />

  return (
    <TeacherTablePanel>
      <TeacherToolbar
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Chế độ giám sát trực tiếp</span>
            </div>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
              {props.pagination.totalItems > 0 ? (
                <>
                  Có <strong className="text-slate-800">{props.pagination.totalItems}</strong> ca thi khả dụng
                </>
              ) : (
                'Sẵn sàng kết nối phòng thi'
              )}
            </span>
          </div>
        }
        searchValue={props.searchQuery}
        onSearchChange={props.onSearchChange}
        searchPlaceholder="Tìm tên ca thi, mã lớp hoặc môn học..."
        onReset={props.onReset}
      />
      <AssignmentTable
        assignments={props.assignments}
        searchQuery={props.searchQuery}
        loading={props.loading}
        onOpen={props.onOpen}
      />
      <TeacherPagination
        page={props.pagination.page}
        totalPages={props.pagination.totalPages}
        totalItems={props.pagination.totalItems}
        onChange={props.onPageChange}
      />
    </TeacherTablePanel>
  )
}

function AssignmentTable({
  assignments,
  searchQuery,
  loading,
  onOpen,
}: Pick<ProctoringAssignmentPickerProps, 'assignments' | 'searchQuery' | 'loading' | 'onOpen'>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Ca thi</th>
            <th className="whitespace-nowrap px-5 py-3">Lớp học phần</th>
            <th className="whitespace-nowrap px-5 py-3">Thời gian</th>
            <th className="whitespace-nowrap px-5 py-3">Trạng thái</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.map((assignment) => (
            <AssignmentRow key={assignment.id} assignment={assignment} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
      {!loading && assignments.length === 0 && <AssignmentEmpty hasSearch={Boolean(searchQuery.trim())} />}
      {loading && <div className="py-12 text-center text-sm text-slate-500">Đang tải các ca coi thi...</div>}
    </div>
  )
}

function AssignmentRow({
  assignment,
  onOpen,
}: {
  assignment: ProctorAssignmentApiDto
  onOpen: (assignment: ProctorAssignmentApiDto) => void
}) {
  return (
    <tr className="hover:bg-gray-50/70">
      <td className="px-5 py-4">
        <p className="font-semibold text-slate-900">{assignment.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{assignment.courseOffering.subjectName}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{assignment.courseOffering.code}</td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatAssignmentTime(assignment)}</td>
      <td className="whitespace-nowrap px-5 py-4">
        <AppBadge tone="emerald">Đang diễn ra</AppBadge>
      </td>
      <td className="px-5 py-4 text-right">
        <ProctorAssignmentAction assignment={assignment} variant="label" onOpen={onOpen} />
      </td>
    </tr>
  )
}

function AssignmentEmpty({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <CalendarClock size={22} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          {hasSearch ? 'Không tìm thấy ca thi phù hợp' : 'Hiện không có ca thi đang diễn ra'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {hasSearch ? 'Thử thay đổi hoặc xóa từ khóa tìm kiếm.' : 'Các ca đang mở sẽ tự động xuất hiện tại đây.'}
        </p>
      </div>
    </div>
  )
}

function AssignmentError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-gray-100 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
        <RefreshCw size={15} /> Thử lại
      </button>
    </div>
  )
}

function formatAssignmentTime(assignment: ProctorAssignmentApiDto) {
  const start = new Date(assignment.startTime)
  const end = new Date(assignment.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'

  return `${start.toLocaleDateString('vi-VN')} ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}
