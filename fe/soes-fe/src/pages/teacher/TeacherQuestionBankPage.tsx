import { Archive, Clock, Database, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../../components/common/ConfirmDialog'
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
import type { Question } from './types/teacher-question-bank.types'

export default function TeacherQuestionBankPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const questionApi = useTeacherQuestions()
  const questions: Question[] = questionApi.questions
  const subjects = questionApi.subjects

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
  const [archivingQuestion, setArchivingQuestion] = useState<Question | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

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
      await questionApi.save(savedQuestionData, editingQuestion?.id)
      toast.success(editingQuestion ? 'Đã cập nhật câu hỏi.' : 'Đã thêm câu hỏi vào ngân hàng cá nhân.')
      setEditingQuestion(null)
    } catch {
      toast.error('Không thể lưu câu hỏi. Vui lòng thử lại.')
    }
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

  const confirmArchiveQuestion = async () => {
    if (!archivingQuestion) return
    setIsArchiving(true)
    try {
      await questionApi.archive(archivingQuestion.id)
      toast.success('Đã lưu trữ câu hỏi.')
    } catch {
      toast.error('Không thể lưu trữ câu hỏi. Vui lòng thử lại.')
    } finally {
      setIsArchiving(false)
      setArchivingQuestion(null)
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
              isLoading={questionApi.loading}
              onView={setViewingQuestion}
              onEdit={(q) => {
                setEditingQuestion(q)
                setIsEditorOpen(true)
              }}
              onArchive={setArchivingQuestion}
              onRestore={async (q) => {
                try {
                  await questionApi.restore(q.id)
                  toast.success('Đã khôi phục câu hỏi.')
                } catch {
                  toast.error('Không thể khôi phục câu hỏi. Vui lòng thử lại.')
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

      <ConfirmDialog
        open={Boolean(archivingQuestion)}
        title="Lưu trữ câu hỏi"
        description={(
          <>
            Câu hỏi <strong className="text-slate-900">{archivingQuestion?.title}</strong> sẽ ẩn khỏi danh sách mặc định
            và không được dùng để chọn vào đề mới. Bạn vẫn có thể khôi phục câu hỏi sau này.
          </>
        )}
        confirmLabel="Lưu trữ"
        icon={<Archive size={19} className="text-amber-600" />}
        pending={isArchiving}
        onClose={() => setArchivingQuestion(null)}
        onConfirm={() => void confirmArchiveQuestion()}
      />

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
