import { CalendarClock, Eye, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherProctorAssignments } from './hooks/useTeacherProctorAssignments'
import type {
  ProctorAssignmentApiDto,
  ProctorAssignmentStatus,
} from './types/teacher-course-api.types'

const statusMeta: Record<ProctorAssignmentStatus, { label: string; tone: 'blue' | 'emerald' | 'gray' | 'rose' }> = {
  SCHEDULED: { label: 'Đã lên lịch', tone: 'blue' },
  OPEN: { label: 'Đang diễn ra', tone: 'emerald' },
  CLOSED: { label: 'Đã kết thúc', tone: 'gray' },
  CANCELLED: { label: 'Đã hủy', tone: 'rose' },
}

export default function TeacherInvigilationSchedulePage() {
  const navigate = useNavigate()
  const { assignments, loading, error, retry } = useTeacherProctorAssignments()
  const [status, setStatus] = useState('ALL')
  const [keyword, setKeyword] = useState('')

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi')
    const matchesStatus = status === 'ALL' || assignment.status === status
    const matchesKeyword = !normalizedKeyword || [
      assignment.title,
      assignment.courseOffering.code,
      assignment.courseOffering.subjectName,
    ].some((value) => value.toLocaleLowerCase('vi').includes(normalizedKeyword))
    return matchesStatus && matchesKeyword
  }), [assignments, keyword, status])

  const openProctoring = (assignment: ProctorAssignmentApiDto) => {
    navigate(`/teacher/proctoring?scheduleId=${encodeURIComponent(assignment.scheduleId)}&courseOfferingId=${encodeURIComponent(assignment.courseOffering.id)}`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Lịch coi thi"
            description="Các ca thi bạn được phân công coi thi hoặc đã trực tiếp tạo cho lớp phụ trách."
            icon={<CalendarClock size={21} />}
          />

          <TeacherTablePanel>
            <TeacherToolbar
              filters={
                <AppSelect
                  value={status}
                  onChange={setStatus}
                  className="w-48"
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'SCHEDULED', label: 'Đã lên lịch' },
                    { value: 'OPEN', label: 'Đang diễn ra' },
                  ]}
                />
              }
              searchValue={keyword}
              onSearchChange={setKeyword}
              searchPlaceholder="Tìm ca thi, môn hoặc mã lớp..."
              onReset={() => { setStatus('ALL'); setKeyword('') }}
            />

            {loading && <ScheduleMessage message="Đang tải lịch coi thi..." />}
            {error && <ScheduleMessage message={error} action={retry} />}
            {!loading && !error && filteredAssignments.length === 0 && (
              <ScheduleMessage message="Không có ca thi phù hợp với bộ lọc." />
            )}

            {!loading && !error && filteredAssignments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-3.5">Ca thi</th>
                      <th className="whitespace-nowrap px-6 py-3.5">Lớp được phân công</th>
                      <th className="whitespace-nowrap px-6 py-3.5">Thời gian</th>
                      <th className="whitespace-nowrap px-6 py-3.5">Trạng thái</th>
                      <th className="whitespace-nowrap px-6 py-3.5">Nguồn</th>
                      <th className="whitespace-nowrap px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssignments.map((assignment) => {
                      const meta = statusMeta[assignment.status]
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50/60">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{assignment.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{assignment.courseOffering.subjectName}</p>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">
                            {assignment.courseOffering.code}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">
                            {formatScheduleTime(assignment.startTime, assignment.endTime)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <AppBadge tone={meta.tone}>{meta.label}</AppBadge>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-600">
                            {assignment.source === 'ASSIGNED' ? 'Được phân công' : 'Ca đã tạo'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openProctoring(assignment)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                              title={assignment.status === 'OPEN' ? 'Vào giám sát' : 'Xem ca thi'}
                              aria-label={assignment.status === 'OPEN' ? 'Vào giám sát' : 'Xem ca thi'}
                            >
                              {assignment.status === 'OPEN' ? <ShieldCheck size={18} /> : <Eye size={18} />}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TeacherTablePanel>
        </main>
      </div>
    </div>
  )
}

function ScheduleMessage({ message, action }: { message: string; action?: () => void }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 px-6 py-10 text-sm text-slate-500">
      <span>{message}</span>
      {action && (
        <button type="button" onClick={action} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}

function formatScheduleTime(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const date = new Intl.DateTimeFormat('vi-VN').format(start)
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} · ${time.format(start)} - ${time.format(end)}`
}
