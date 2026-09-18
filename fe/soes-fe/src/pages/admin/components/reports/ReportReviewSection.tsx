import { ClipboardCheck, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { AdminReportsDto } from '../../api/admin-monitoring.api'
import AdminTablePanel from '../AdminTablePanel'

type ReviewTab = 'attempts' | 'questions'
type LowCorrectQuestion = AdminReportsDto['lowCorrectQuestions'][number]
type ReviewAttempt = AdminReportsDto['reviewAttempts'][number]

interface ReportReviewSectionProps {
  questions: LowCorrectQuestion[]
  attempts: ReviewAttempt[]
  loading: boolean
}

const questionColumns: ColumnDef<LowCorrectQuestion>[] = [
  { header: 'CÂU HỎI', render: (question) => <QuestionCell question={question} /> },
  { header: 'ĐÚNG / TỔNG', width: '150px', className: 'whitespace-nowrap', render: (question) => `${question.correct} / ${question.answered}` },
  { header: 'TỶ LỆ ĐÚNG', width: '150px', className: 'whitespace-nowrap', render: (question) => <AppBadge tone="rose" shape="rounded">{question.correctRate}%</AppBadge> },
]

const attemptColumns: ColumnDef<ReviewAttempt>[] = [
  { header: 'SINH VIÊN', width: '260px', render: (attempt) => <StudentCell attempt={attempt} /> },
  { header: 'CA THI', render: (attempt) => <ScheduleCell attempt={attempt} /> },
  { header: 'ĐIỂM', width: '100px', className: 'whitespace-nowrap', render: (attempt) => <span className="font-semibold text-slate-800">{attempt.score ?? '-'}</span> },
  { header: 'VI PHẠM', width: '110px', className: 'whitespace-nowrap', render: (attempt) => <AppBadge tone="rose" shape="rounded">{attempt.violationCount}</AppBadge> },
  { header: 'LÝ DO RÀ SOÁT', width: '280px', render: (attempt) => <p className="max-w-72 leading-5 text-slate-600" title={attempt.reason}>{attempt.reason}</p> },
]

export default function ReportReviewSection({ questions, attempts, loading }: ReportReviewSectionProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('attempts')

  return (
    <AdminTablePanel>
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Dữ liệu cần hậu kiểm</h2>
          <p className="mt-1 text-xs text-slate-500">Tập trung vào bài thi bất thường và câu hỏi có tỷ lệ đúng thấp.</p>
        </div>
        <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Loại dữ liệu hậu kiểm">
          <ReviewTabButton active={activeTab === 'attempts'} icon={<ClipboardCheck size={15} />} label="Bài thi" count={attempts.length} onClick={() => setActiveTab('attempts')} />
          <ReviewTabButton active={activeTab === 'questions'} icon={<HelpCircle size={15} />} label="Câu hỏi" count={questions.length} onClick={() => setActiveTab('questions')} />
        </div>
      </div>

      {activeTab === 'attempts' ? (
        <DataTable embedded columns={attemptColumns} data={loading ? [] : attempts} keyExtractor={(attempt) => attempt.id} isLoading={loading} pageSize={5} emptyText="Chưa có bài thi cần rà soát." />
      ) : (
        <DataTable embedded columns={questionColumns} data={loading ? [] : questions} keyExtractor={(question) => `${question.scheduleTitle}-${question.id}`} isLoading={loading} pageSize={5} emptyText="Chưa có câu hỏi cần xem lại." />
      )}
    </AdminTablePanel>
  )
}

interface ReviewTabButtonProps {
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  onClick: () => void
}

function ReviewTabButton({ active, icon, label, count, onClick }: ReviewTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors ${active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {icon}<span>{label}</span><span className={`rounded px-1.5 py-0.5 text-[11px] ${active ? 'bg-emerald-50' : 'bg-white/70'}`}>{count}</span>
    </button>
  )
}

function QuestionCell({ question }: { question: LowCorrectQuestion }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-950" title={question.title}>{question.title}</p>
      <p className="mt-1 truncate text-xs text-slate-400" title={`${question.subject} · ${question.scheduleTitle}`}>{question.subject} · {question.scheduleTitle}</p>
    </div>
  )
}

function StudentCell({ attempt }: { attempt: ReviewAttempt }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-950" title={attempt.studentName}>{attempt.studentName}</p>
      <p className="mt-1 whitespace-nowrap text-xs text-slate-400">{attempt.studentCode} · {attempt.courseCode}</p>
    </div>
  )
}

function ScheduleCell({ attempt }: { attempt: ReviewAttempt }) {
  return <p className="max-w-sm truncate text-slate-700" title={attempt.scheduleTitle}>{attempt.scheduleTitle}</p>
}
