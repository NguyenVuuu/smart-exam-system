import AppBadge from '../../../../components/common/AppBadge'
import ProctorAssignmentAction from '../proctoring/ProctorAssignmentAction'
import type {
  ProctorAssignmentApiDto,
  ProctorAssignmentStatus,
} from '../../types/teacher-course-api.types'
import { formatTimeRange } from '../../utils/scheduleCalendar.utils'

interface TeacherScheduleTableViewProps {
  assignments: ProctorAssignmentApiDto[]
  statusMeta: Record<ProctorAssignmentStatus, { label: string; tone: 'blue' | 'emerald' | 'gray' | 'rose' }>
  onOpenProctoring: (assignment: ProctorAssignmentApiDto) => void
}

export default function TeacherScheduleTableView({
  assignments,
  statusMeta,
  onOpenProctoring,
}: TeacherScheduleTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-6 py-3.5">Ca thi</th>
            <th className="whitespace-nowrap px-6 py-3.5">Lớp học phần</th>
            <th className="whitespace-nowrap px-6 py-3.5">Thời gian</th>
            <th className="whitespace-nowrap px-6 py-3.5">Trạng thái</th>
            <th className="whitespace-nowrap px-6 py-3.5">Nguồn</th>
            <th className="whitespace-nowrap px-6 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.map((assignment) => {
            const meta = statusMeta[assignment.status]
            const start = new Date(assignment.startTime)
            const dateFormatted = new Intl.DateTimeFormat('vi-VN').format(start)
            return (
              <tr key={assignment.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{assignment.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{assignment.courseOffering.subjectName}</p>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">
                  {assignment.courseOffering.code}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">
                  {dateFormatted} · {formatTimeRange(assignment.startTime, assignment.endTime)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <AppBadge tone={meta.tone}>{meta.label}</AppBadge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-600">
                  {assignment.source === 'ASSIGNED' ? 'Được phân công' : 'Tự tạo ca thi'}
                </td>
                <td className="px-6 py-4 text-right">
                  <ProctorAssignmentAction assignment={assignment} variant="icon" onOpen={onOpenProctoring} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
