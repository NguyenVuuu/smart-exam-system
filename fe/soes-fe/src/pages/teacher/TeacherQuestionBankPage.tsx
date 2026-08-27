import { Clock, Database, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherTopBar from './components/TeacherTopBar'
import AIGenerationHistoryModal from './components/question-bank/AIGenerationHistoryModal'
import AIQuestionGeneratorModal from './components/question-bank/AIQuestionGeneratorModal'
import QuestionBankTable from './components/question-bank/QuestionBankTable'
import QuestionBankToolbar from './components/question-bank/QuestionBankToolbar'
import QuestionDetailModal from './components/question-bank/QuestionDetailModal'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import RemoveSharedQuestionDialog from './components/question-bank/RemoveSharedQuestionDialog'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import type { Question } from './types/teacher-question-bank.types'

export default function TeacherQuestionBankPage() {
  const user = useAuthStore((state) => state.user)
  const questions = useTeacherWorkspaceStore((state) => state.questions)
  const upsertQuestion = useTeacherWorkspaceStore((state) => state.upsertQuestion)
  const addQuestions = useTeacherWorkspaceStore((state) => state.addQuestions)
  const submitQuestionForReview = useTeacherWorkspaceStore((state) => state.submitQuestionForReview)
  const archiveQuestion = useTeacherWorkspaceStore((state) => state.archiveQuestion)
  const restoreQuestion = useTeacherWorkspaceStore((state) => state.restoreQuestion)
  const removeQuestionFromSharedBank = useTeacherWorkspaceStore((state) => state.removeQuestionFromSharedBank)
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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
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
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subjectName && q.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'ALL' || q.type === selectedType
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty

    return matchesSubject && matchesSearch && matchesType && matchesDifficulty
  })

  const handleSaveQuestion = (savedQuestionData: Partial<Question>) => {
    if (editingQuestion) {
      upsertQuestion({ ...editingQuestion, ...savedQuestionData } as Question)
    } else {
      const newQuestion: Question = {
        id: `q-${Date.now()}`,
        subjectId: savedQuestionData.subjectId || 'sub-01',
        subjectName: savedQuestionData.subjectName || 'Lập trình Java căn bản',
        teacherId: 'gv-01',
        teacherName: 'TS. Nguyễn Văn Giảng',
        bankScope: activeTab === 'SHARED' ? 'SHARED' : savedQuestionData.bankScope || 'PERSONAL',
        reviewStatus:
          activeTab === 'SHARED' && canApproveSharedQuestions
            ? 'APPROVED'
            : savedQuestionData.reviewStatus || 'PRIVATE',
        type: savedQuestionData.type || 'SINGLE_CHOICE',
        difficulty: savedQuestionData.difficulty || 'EASY',
        content: savedQuestionData.content || '',
        explanation: savedQuestionData.explanation,
        options: savedQuestionData.options,
        programmingLanguage: savedQuestionData.programmingLanguage,
        timeLimitMs: savedQuestionData.timeLimitMs,
        memoryLimitMb: savedQuestionData.memoryLimitMb,
        testCases: savedQuestionData.testCases,
        createdAt: 'Vừa xong',
      }
      upsertQuestion(newQuestion)
    }
    setEditingQuestion(null)
  }

  const handleShareToSharedBank = (qId: string) => {
    submitQuestionForReview(qId, canApproveSharedQuestions)
    toast.success(
      canApproveSharedQuestions
        ? 'Đã đưa câu hỏi vào Ngân hàng chung của Bộ môn. Trạng thái: Đã duyệt.'
        : 'Đã gửi yêu cầu đóng góp câu hỏi vào Ngân hàng chung của Bộ môn! Trạng thái: Chờ duyệt.',
    )
  }

  const handleArchiveQuestion = (q: Question) => {
    const confirmed = window.confirm(
      'Lưu trữ câu hỏi này? Câu hỏi sẽ ẩn khỏi danh sách mặc định và không dùng để chọn vào đề mới.',
    )
    if (!confirmed) return
    archiveQuestion(q.id)
  }

  const handleRemoveFromSharedBank = (q: Question) => {
    setRemovingSharedQuestion(q)
    setRemoveReason('Gỡ khỏi ngân hàng chung để xử lý vấn đề chuyên môn.')
  }

  const confirmRemoveFromSharedBank = () => {
    if (!removingSharedQuestion || removeReason.trim().length < 5) return
    removeQuestionFromSharedBank(removingSharedQuestion.id, removeReason.trim(), user?.fullName || 'Trưởng bộ môn')
    setRemovingSharedQuestion(null)
    toast.success('Đã gỡ câu hỏi khỏi Ngân hàng chung.')
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
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  <Sparkles size={15} className="text-amber-500" />
                  AI Bóc Tách Đề (PDF / Word)
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
              onRestore={(q) => restoreQuestion(q.id)}
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
      />

      <QuestionDetailModal
        isOpen={!!viewingQuestion}
        question={viewingQuestion}
        onClose={() => setViewingQuestion(null)}
      />

      <AIQuestionGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApprovedSave={(approvedDrafts) => {
          const converted: Question[] = approvedDrafts.map((d) => ({
            id: d.id,
            subjectId: 'sub-01',
            subjectName: 'Lập trình Java căn bản',
            teacherId: 'gv-01',
            teacherName: 'TS. Nguyễn Văn Giảng',
            bankScope: activeTab === 'SHARED' ? 'SHARED' : 'PERSONAL',
            reviewStatus: 'PRIVATE',
            type: d.type,
            difficulty: d.difficulty,
            content: d.content,
            explanation: d.explanation,
            options: d.options,
            createdAt: 'Vừa xong (AI)',
          }))
          addQuestions(converted)
          setIsAiModalOpen(false)
        }}
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
