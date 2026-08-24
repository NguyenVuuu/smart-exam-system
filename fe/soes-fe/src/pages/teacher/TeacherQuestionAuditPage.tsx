import { AlertCircle, Edit, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import type { Question } from './types/teacher-question-bank.types'
import { validateQuestion } from './utils/QuestionValidation'

interface AuditIssue {
  id: string
  questionId: string
  subjectName: string
  content: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
}

function buildAuditIssues(questions: Question[]): AuditIssue[] {
  return questions.flatMap((question) => {
    const errors = validateQuestion(question)
    const warnings = question.explanation?.trim()
      ? []
      : ['Thiếu lời giải hoặc giải thích dùng khi cho phép xem lại bài.']

    return [...errors, ...warnings].map((description, index) => ({
      id: `${question.id}-${index}`,
      questionId: question.id,
      subjectName: question.subjectName,
      content: question.content,
      severity: errors.includes(description) ? 'HIGH' : 'LOW',
      description,
    }))
  })
}

const severityTone = { HIGH: 'rose', MEDIUM: 'amber', LOW: 'blue' } as const
const severityLabel = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' } as const

export default function TeacherQuestionAuditPage() {
  const questions = useTeacherWorkspaceStore((state) => state.questions)
  const upsertQuestion = useTeacherWorkspaceStore((state) => state.upsertQuestion)
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | AuditIssue['severity']>('ALL')
  const [isScanning, setIsScanning] = useState(false)
  const [editingIssue, setEditingIssue] = useState<AuditIssue | null>(null)

  const issues = buildAuditIssues(questions)
  const visibleIssues = issues.filter(
    (issue) => selectedSeverity === 'ALL' || issue.severity === selectedSeverity,
  )
  const highSeverityCount = issues.filter((issue) => issue.severity === 'HIGH').length
  const healthScore = Math.max(0, 100 - highSeverityCount * 15 - (issues.length - highSeverityCount) * 5)

  const columns: ColumnDef<AuditIssue>[] = [
    {
      header: 'Nội dung câu hỏi',
      render: (issue) => (
        <div className="max-w-2xl space-y-1 py-1">
          <p className="text-sm font-semibold text-gray-900 leading-relaxed">{issue.content}</p>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={13} /> {issue.description}
          </p>
        </div>
      ),
    },
    { header: 'Môn học', width: '220px', render: (issue) => <span className="text-sm text-gray-700">{issue.subjectName}</span> },
    {
      header: 'Mức độ', width: '130px', align: 'center',
      render: (issue) => <AppBadge tone={severityTone[issue.severity]} className="whitespace-nowrap">{severityLabel[issue.severity]}</AppBadge>,
    },
    {
      header: 'Thao tác', width: '100px', align: 'right',
      render: (issue) => (
        <button
          onClick={() => setEditingIssue(issue)}
          title="Mở câu hỏi để sửa"
          className="inline-flex rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Edit size={16} />
        </button>
      ),
    },
  ]

  const runScan = () => {
    setIsScanning(true)
    window.setTimeout(() => setIsScanning(false), 500)
  }

  const editedQuestion = editingIssue
    ? questions.find((question) => question.id === editingIssue.questionId) ?? null
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <TeacherSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TeacherTopBar />
        <main className="flex-1 space-y-6 overflow-y-auto px-8 py-6">
          <TeacherPageHeader
            title="Rà soát câu hỏi"
            description="Kiểm tra trực tiếp dữ liệu hiện có trong ngân hàng câu hỏi"
            actions={
              <button onClick={runScan} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white">
                <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} /> Rà soát lại
              </button>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="Điểm chất lượng" value={`${healthScore}/100`} icon={<ShieldCheck size={18} />} />
            <Metric label="Lỗi nghiêm trọng" value={highSeverityCount} icon={<AlertCircle size={18} />} tone="rose" />
            <Metric label="Tổng vấn đề" value={issues.length} icon={<AlertCircle size={18} />} tone="amber" />
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <AppSelect
                value={selectedSeverity}
                onChange={setSelectedSeverity}
                className="w-48"
                options={[
                  { value: 'ALL', label: 'Tất cả mức độ' },
                  { value: 'HIGH', label: 'Cao' },
                  { value: 'MEDIUM', label: 'Trung bình' },
                  { value: 'LOW', label: 'Thấp' },
                ]}
              />
              <span className="text-xs text-gray-500">{visibleIssues.length} vấn đề</span>
            </div>
            <DataTable columns={columns} data={visibleIssues} keyExtractor={(issue) => issue.id} emptyText="Ngân hàng câu hỏi hiện đạt yêu cầu." />
          </div>
        </main>
      </div>

      {editedQuestion && (
        <QuestionEditorModal
          key={editedQuestion.id}
          isOpen
          initialQuestion={editedQuestion}
          onClose={() => setEditingIssue(null)}
          onSave={(updates) => {
            upsertQuestion({ ...editedQuestion, ...updates })
            setEditingIssue(null)
          }}
        />
      )}
    </div>
  )
}

function Metric({ label, value, icon, tone = 'blue' }: { label: string; value: string | number; icon: React.ReactNode; tone?: 'blue' | 'rose' | 'amber' }) {
  const toneClass = { blue: 'bg-blue-50 text-blue-600', rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600' }[tone]
  return <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"><div className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>{icon}</div><div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold text-gray-900">{value}</p></div></div>
}
