import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import QuestionAuditMetrics from './components/question-audit/QuestionAuditMetrics'
import QuestionAuditTable from './components/question-audit/QuestionAuditTable'
import QuestionAuditToolbar, {
  type QuestionAuditSeverityFilter,
} from './components/question-audit/QuestionAuditToolbar'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherTopBar from './components/TeacherTopBar'
import { useQuestionAudit } from './hooks/useQuestionAudit'
import { toQuestion } from './mappers/teacher-question.mapper'
import type { Question } from './types/teacher-question-bank.types'
import type { QuestionAuditItemDto } from './types/teacher-question-api.types'

const PAGE_SIZE = 10

export default function TeacherQuestionAuditPage() {
  const [page, setPage] = useState(1)
  const [selectedSeverity, setSelectedSeverity] = useState<QuestionAuditSeverityFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<QuestionAuditItemDto | null>(null)
  const [debouncedSearch] = useDebounce(searchQuery.trim(), 300)

  const filters = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    keyword: debouncedSearch || undefined,
    severity: selectedSeverity === 'ALL' ? undefined : selectedSeverity,
  }), [debouncedSearch, page, selectedSeverity])
  const { audit, subjects, updateQuestion } = useQuestionAudit(filters)

  const changeSeverity = (severity: QuestionAuditSeverityFilter) => {
    setSelectedSeverity(severity)
    setPage(1)
  }

  const changeSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const resetFilters = () => {
    setSelectedSeverity('ALL')
    setSearchQuery('')
    setPage(1)
  }

  const openEditor = useCallback((auditItem: QuestionAuditItemDto) => {
    setEditingItem(auditItem)
  }, [])

  const saveQuestion = async (updates: Partial<Question>) => {
    if (!editingItem) return
    await updateQuestion.mutateAsync({ id: editingItem.question.id, updates })
    toast.success('Đã cập nhật và rà soát lại câu hỏi.')
  }

  const rescan = async () => {
    const refreshed = await audit.refetch()
    if (refreshed.isError) {
      toast.error('Không thể rà soát lại ngân hàng câu hỏi.')
      return
    }
    toast.success('Đã hoàn thành rà soát lại ngân hàng câu hỏi.')
  }

  const auditPage = audit.data
  const editedQuestion = editingItem ? toQuestion(editingItem.question) : null

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
            actions={(
              <button
                type="button"
                onClick={() => void rescan()}
                disabled={audit.isFetching}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={15} className={audit.isFetching ? 'animate-spin' : ''} />
                Rà soát lại
              </button>
            )}
          />

          <QuestionAuditMetrics metrics={auditPage?.summary} loading={audit.isLoading} />

          <TeacherTablePanel>
            <QuestionAuditToolbar
              selectedSeverity={selectedSeverity}
              onSeverityChange={changeSeverity}
              searchQuery={searchQuery}
              onSearchChange={changeSearch}
              questionCount={auditPage?.pagination.totalItems ?? 0}
              issueCount={auditPage?.matchingIssueCount ?? 0}
              onReset={resetFilters}
            />
            <QuestionAuditTable
              items={auditPage?.items ?? []}
              page={auditPage?.pagination.page ?? page}
              pageSize={PAGE_SIZE}
              totalItems={auditPage?.pagination.totalItems ?? 0}
              totalPages={auditPage?.pagination.totalPages ?? 1}
              loading={audit.isLoading}
              error={audit.isError}
              onPageChange={setPage}
              onEdit={openEditor}
              onRetry={() => void audit.refetch()}
            />
          </TeacherTablePanel>
        </main>
      </div>

      {editedQuestion && (
        <QuestionEditorModal
          key={editedQuestion.id}
          isOpen
          initialQuestion={editedQuestion}
          subjects={subjects.data ?? []}
          onClose={() => setEditingItem(null)}
          onSave={saveQuestion}
        />
      )}
    </div>
  )
}
