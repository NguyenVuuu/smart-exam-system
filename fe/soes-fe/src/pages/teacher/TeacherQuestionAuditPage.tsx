import { AlertCircle, Edit, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import QuestionAuditMetrics from './components/question-audit/QuestionAuditMetrics'
import QuestionAuditToolbar from './components/question-audit/QuestionAuditToolbar'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import type { Question } from './types/teacher-question-bank.types'
import { auditQuestions, getAuditMetrics, type AuditIssue } from './utils/QuestionAuditRules'

const severityTone = { HIGH: 'rose', LOW: 'amber' } as const
const severityLabel = { HIGH: 'Lỗi bắt buộc', LOW: 'Cảnh báo' } as const

export default function TeacherQuestionAuditPage() {
  const questionApi = useTeacherQuestions('AUDIT')
  const questions: Question[] = questionApi.questions
  const subjects = questionApi.subjects

  const [selectedSeverity, setSelectedSeverity] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [editingIssue, setEditingIssue] = useState<AuditIssue | null>(null)

  // 1. Quét và tính toán số liệu thống kê
  const allIssues = useMemo(() => auditQuestions(questions), [questions])
  const metrics = useMemo(() => getAuditMetrics(questions, allIssues), [questions, allIssues])

  // 2. Lọc danh sách vấn đề theo tìm kiếm và mức độ
  const visibleIssues = useMemo(() => {
    return allIssues.filter((issue) => {
      const matchesSeverity = selectedSeverity === 'ALL' || issue.severity === selectedSeverity
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        issue.content.toLowerCase().includes(q) ||
        issue.subjectName.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q)
      return matchesSeverity && matchesSearch
    })
  }, [allIssues, selectedSeverity, searchQuery])

  // 3. Cấu hình bảng hiển thị
  const columns: ColumnDef<AuditIssue>[] = [
    {
      header: 'Nội dung câu hỏi',
      render: (issue) => (
        <div className="max-w-2xl space-y-1.5 py-1">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900 leading-relaxed">
            {issue.content}
          </p>
          <p
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              issue.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
            }`}
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{issue.description}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'Môn học',
      width: '220px',
      render: (issue) => <span className="text-sm text-gray-700">{issue.subjectName}</span>,
    },
    {
      header: 'Mức độ',
      width: '150px',
      align: 'center',
      render: (issue) => (
        <AppBadge
          tone={severityTone[issue.severity]}
          shape="rounded"
          className="whitespace-nowrap font-semibold"
        >
          {severityLabel[issue.severity]}
        </AppBadge>
      ),
    },
    {
      header: 'Thao tác',
      width: '100px',
      align: 'right',
      render: (issue) => (
        <button
          onClick={() => setEditingIssue(issue)}
          title="Sửa câu hỏi này"
          className="inline-flex rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Edit size={16} />
        </button>
      ),
    },
  ]

  const handleRescan = async () => {
    setIsScanning(true)
    try {
      await questionApi.retry()
      toast.success('Đã hoàn thành rà soát lại ngân hàng câu hỏi!')
    } finally {
      setIsScanning(false)
    }
  }

  const editedQuestion = editingIssue
    ? questions.find((q) => q.id === editingIssue.questionId) ?? null
    : null

  const handleSaveQuestion = async (updates: Partial<Question>) => {
    if (!editedQuestion) return
    try {
      await questionApi.save(updates, editedQuestion.id)
      setEditingIssue(null)
      toast.success('Đã cập nhật câu hỏi thành công!')
    } catch {
      toast.error('Không thể lưu câu hỏi. Vui lòng thử lại.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Rà soát câu hỏi"
            description="Kiểm tra kỹ thuật và điều kiện đưa câu hỏi vào đề thi hoặc gửi duyệt"
            icon={<ShieldCheck size={21} />}
            actions={
              <button
                onClick={handleRescan}
                disabled={isScanning}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
                Rà soát lại
              </button>
            }
          />

          {/* 3 Thẻ thống kê KPI (Hình 2) */}
          <QuestionAuditMetrics metrics={metrics} />

          {/* Bảng danh sách các vấn đề phát hiện được */}
          <TeacherTablePanel>
            <QuestionAuditToolbar
              selectedSeverity={selectedSeverity}
              onSeverityChange={setSelectedSeverity}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              issueCount={visibleIssues.length}
              onReset={() => {
                setSelectedSeverity('ALL')
                setSearchQuery('')
              }}
            />
            <DataTable
              embedded
              columns={columns}
              data={questionApi.loading ? [] : visibleIssues}
              keyExtractor={(issue) => issue.id}
              emptyText={questionApi.loading
                ? 'Đang rà soát câu hỏi...'
                : 'Ngân hàng câu hỏi cá nhân không có vấn đề kỹ thuật nào.'}
            />
          </TeacherTablePanel>
          {questionApi.error && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{questionApi.error}</span>
              <button type="button" onClick={() => void questionApi.retry()} className="font-semibold underline">
                Thử lại
              </button>
            </div>
          )}
        </main>
      </div>

      {editedQuestion && (
        <QuestionEditorModal
          key={editedQuestion.id}
          isOpen
          initialQuestion={editedQuestion}
          subjects={subjects}
          onClose={() => setEditingIssue(null)}
          onSave={handleSaveQuestion}
        />
      )}
    </div>
  )
}
