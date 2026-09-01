import { Clock, Database, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherTopBar from './components/TeacherTopBar'
import AIGenerationHistoryModal from './components/question-bank/AIGenerationHistoryModal'
import QuestionBankTable from './components/question-bank/QuestionBankTable'
import QuestionBankToolbar from './components/question-bank/QuestionBankToolbar'
import QuestionDetailModal from './components/question-bank/QuestionDetailModal'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import RemoveSharedQuestionDialog from './components/question-bank/RemoveSharedQuestionDialog'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import type { Question } from './types/teacher-question-bank.types'

export default function TeacherQuestionBankPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const questionApi = useTeacherQuestions()
  const storeQuestions = useTeacherWorkspaceStore((state) => state.questions)
  const upsertStoreQuestion = useTeacherWorkspaceStore((state) => state.upsertQuestion)
  const archiveStoreQuestion = useTeacherWorkspaceStore((state) => state.archiveQuestion)
  const restoreStoreQuestion = useTeacherWorkspaceStore((state) => state.restoreQuestion)
  const removeStoreSharedQuestion = useTeacherWorkspaceStore((state) => state.removeQuestionFromSharedBank)

  // Ưu tiên toàn bộ câu hỏi từ API thực tế, fallback sang mock store nếu API rỗng
  const questions: Question[] =
    questionApi.questions.length > 0 ? questionApi.questions : storeQuestions

  const subjects =
    questionApi.subjects.length > 0
      ? questionApi.subjects
      : [
          { id: 'sub-01', name: 'Lập trình Java căn bản' },
          { id: 'sub-02', name: 'Cấu trúc dữ liệu & GT' },
          { id: 'sub-03', name: 'Lập trình C++' },
          { id: 'sub-04', name: 'Cơ sở dữ liệu' },
        ]

  const canApproveSharedQuestions = user?.permissions?.includes('APPROVE_SHARED_QUESTION') ?? false

  // Tabs & Filters state
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SHARED'>('PERSONAL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [removingSharedQuestion, setRemovingSharedQuestion] = useState<Question | null>(null)
  const [removeReason, setRemoveReason] = useState('Gỡ khỏi ngân hàng chung để xử lý vấn đề chuyên môn.')

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedSubject('ALL')
    setSelectedType('ALL')
    setSelectedDifficulty('ALL')
    setSelectedStatus('ALL')
  }

  const filteredQuestions = questions.filter((q) => {
    const isArchived = Boolean(q.archivedAt)

    if (activeTab === 'SHARED' && q.reviewStatus !== 'APPROVED') return false

    if (selectedStatus === 'ARCHIVED') {
      if (!isArchived) return false
    } else if (isArchived) {
      return false
    }

    if (selectedStatus !== 'ALL' && selectedStatus !== 'ARCHIVED') {
      if (selectedStatus === 'APPROVED' && q.reviewStatus !== 'APPROVED') return false
      if (selectedStatus === 'PENDING_REVIEW' && q.reviewStatus !== 'PENDING_REVIEW') return false
      if (selectedStatus === 'PRIVATE' && q.reviewStatus && q.reviewStatus !== 'PRIVATE') return false
      if (selectedStatus === 'REJECTED' && q.reviewStatus !== 'REJECTED') return false
      if (selectedStatus === 'REMOVED' && q.reviewStatus !== 'REMOVED') return false
    }

    const matchesSubject = selectedSubject === 'ALL' || q.subjectId === selectedSubject
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subjectName && q.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'ALL' || q.type === selectedType
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty

    return matchesSubject && matchesSearch && matchesType && matchesDifficulty
  })

  const handleSaveQuestion = async (savedQuestionData: Partial<Question>) => {
    try {
      if (questionApi.questions.length > 0 || !editingQuestion) {
        await questionApi.save(savedQuestionData, editingQuestion?.id)
        toast.success(editingQuestion ? 'Đã cập nhật câu hỏi.' : 'Đã thêm câu hỏi vào ngân hàng cá nhân.')
      } else {
        upsertStoreQuestion({ ...editingQuestion, ...savedQuestionData } as Question)
        toast.success('Đã cập nhật câu hỏi.')
      }
    } catch {
      upsertStoreQuestion({ ...editingQuestion, ...savedQuestionData } as Question)
      toast.success('Đã lưu câu hỏi vào bộ nhớ.')
    }
    setEditingQuestion(null)
  }

  const handleShareToSharedBank = async (qId: string) => {
    try {
      await questionApi.share(qId)
      toast.success(
        canApproveSharedQuestions || user?.position === 'DEPARTMENT_HEAD'
          ? 'Đã đưa câu hỏi vào ngân hàng chung toàn trường (Tự động duyệt).'
          : 'Đã gửi câu hỏi để Trưởng bộ môn duyệt vào ngân hàng chung.'
      )
    } catch {
      toast.error('Không thể gửi câu hỏi duyệt. Vui lòng kiểm tra lại trạng thái.')
    }
  }

  const handleArchiveQuestion = async (q: Question) => {
    const confirmed = window.confirm(
      'Lưu trữ câu hỏi này? Câu hỏi sẽ ẩn khỏi danh sách mặc định và không dùng để chọn vào đề mới.',
    )
    if (!confirmed) return
    try {
      await questionApi.archive(q.id)
      toast.success('Đã lưu trữ câu hỏi.')
    } catch {
      archiveStoreQuestion(q.id)
      toast.success('Đã lưu trữ câu hỏi.')
    }
  }

  const handleRemoveFromSharedBank = (q: Question) => {
    setRemovingSharedQuestion(q)
    setRemoveReason('Gỡ khỏi ngân hàng chung để xử lý vấn đề chuyên môn.')
  }

  const confirmRemoveFromSharedBank = async () => {
    if (!removingSharedQuestion || removeReason.trim().length < 5) return
    try {
      if (removingSharedQuestion.sharedBankItemId) {
        await questionApi.removeShared(removingSharedQuestion.sharedBankItemId, removeReason.trim())
      } else {
        removeStoreSharedQuestion(
          removingSharedQuestion.id,
          removeReason.trim(),
          user?.fullName || 'Trưởng bộ môn',
        )
      }
      setRemovingSharedQuestion(null)
      toast.success('Đã gỡ câu hỏi khỏi Ngân hàng chung.')
    } catch {
      toast.error('Không thể gỡ câu hỏi ở trạng thái hiện tại.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Ngân Hàng Câu Hỏi"
            description="Quản lý, đóng góp và tái sử dụng bộ câu hỏi theo môn học thuộc quyền sở hữu của Giảng viên"
            icon={<Database size={21} />}
            actions={
              <>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock size={15} />
                  Lịch sử AI
                </button>

                <button
                  onClick={() => navigate('/teacher/question-bank/ai-generator')}
                  className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  <Sparkles size={15} className="text-amber-500" />
                  Tạo câu hỏi bằng AI
                </button>

                <button
                  onClick={() => {
                    setEditingQuestion(null)
                    setIsEditorOpen(true)
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={18} />
                  Thêm Câu Hỏi Mới
                </button>
              </>
            }
          />

          {/* Segmented Tab Selector */}
          <div className="inline-flex w-full max-w-md rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100">
            <button
              onClick={() => setActiveTab('PERSONAL')}
              className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'PERSONAL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Ngân hàng cá nhân
            </button>
            <button
              onClick={() => setActiveTab('SHARED')}
              className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'SHARED'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Ngân hàng chung
            </button>
          </div>

          <TeacherTablePanel>
            <QuestionBankToolbar
              subjects={subjects}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onReset={handleResetFilters}
            />

            <QuestionBankTable
              questions={filteredQuestions}
              activeTab={activeTab}
              canApproveSharedQuestions={canApproveSharedQuestions}
              onView={setViewingQuestion}
              onEdit={(q) => {
                setEditingQuestion(q)
                setIsEditorOpen(true)
              }}
              onArchive={handleArchiveQuestion}
              onRestore={async (q) => {
                try {
                  await questionApi.restore(q.id)
                  toast.success('Đã khôi phục câu hỏi.')
                } catch {
                  restoreStoreQuestion(q.id)
                  toast.success('Đã khôi phục câu hỏi.')
                }
              }}
              onShare={handleShareToSharedBank}
              onRemoveFromShared={handleRemoveFromSharedBank}
            />
          </TeacherTablePanel>
        </main>
      </div>

      {/* Question Modals */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        subjects={subjects}
      />

      <QuestionDetailModal
        isOpen={!!viewingQuestion}
        question={viewingQuestion}
        onClose={() => setViewingQuestion(null)}
      />

      <AIGenerationHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />

      <RemoveSharedQuestionDialog
        question={removingSharedQuestion}
        reason={removeReason}
        onReasonChange={setRemoveReason}
        onClose={() => setRemovingSharedQuestion(null)}
        onConfirm={confirmRemoveFromSharedBank}
      />
    </div>
  )
}
