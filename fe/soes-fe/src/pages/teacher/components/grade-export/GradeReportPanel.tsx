import AppSelect from '../../../../components/common/AppSelect'
import { formatSessionRange } from '../../../../utils/date.utils'
import type { Exam, ExamSchedule } from '../../types/teacher-exam.types'
import type { GradeStatistics } from '../../utils/teacher-grade-report.utils'
import TeacherToolbar from '../TeacherToolbar'
import GradeDistributionChart from './GradeDistributionChart'
import GradeExportTable, { type StudentGradeRow } from './GradeExportTable'
import GradeStatisticsCards from './GradeStatisticsCards'

interface GradeReportPanelProps {
  exams: Exam[]
  schedules: ExamSchedule[]
  selectedExamId: string
  selectedScheduleId: string
  searchKeyword: string
  rows: StudentGradeRow[]
  statistics: GradeStatistics
  chartData: Array<{ range: string; count: number }>
  loading: boolean
  onExamChange: (examId: string) => void
  onScheduleChange: (scheduleId: string) => void
  onSearchChange: (keyword: string) => void
}

export default function GradeReportPanel({
  exams,
  schedules,
  selectedExamId,
  selectedScheduleId,
  searchKeyword,
  rows,
  statistics,
  chartData,
  loading,
  onExamChange,
  onScheduleChange,
  onSearchChange,
}: GradeReportPanelProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-2">
        <SelectField label="Đề thi">
          <AppSelect
            value={selectedExamId}
            options={exams.map((exam) => ({ value: exam.id, label: exam.title }))}
            onChange={onExamChange}
            placeholder="Chọn đề thi..."
          />
        </SelectField>
        <SelectField label="Ca thi / lớp học phần">
          <AppSelect
            value={selectedScheduleId}
            options={schedules.map((schedule) => ({
              value: schedule.id,
              label: `${schedule.courseCode || 'Ca thi'} (${formatSessionRange(schedule.startTime, schedule.endTime)})`,
            }))}
            onChange={onScheduleChange}
            placeholder="Chọn ca thi..."
            disabled={schedules.length === 0}
          />
        </SelectField>
      </section>

      <GradeStatisticsCards
        totalSubmissions={statistics.totalSubmissions}
        avgScore={statistics.averageScore}
        maxScore={statistics.highestScore}
        minScore={statistics.lowestScore}
        passCount={statistics.passCount}
        passRate={statistics.passRate}
      />

      <GradeDistributionChart chartData={chartData} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <TeacherToolbar
          filters={
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Bảng kết quả sinh viên</h2>
              <p className="mt-0.5 text-xs text-slate-500">Điểm được quy đổi về thang 10 để đối chiếu thống nhất.</p>
            </div>
          }
          searchValue={searchKeyword}
          onSearchChange={onSearchChange}
          searchPlaceholder="Tìm theo MSSV hoặc họ tên..."
          onReset={() => onSearchChange('')}
        />
        <GradeExportTable rows={rows} loading={loading} />
      </section>
    </div>
  )
}

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}
