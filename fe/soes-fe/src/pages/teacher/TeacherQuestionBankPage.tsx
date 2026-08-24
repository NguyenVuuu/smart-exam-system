import {
  Clock,
  Edit,
  Eye,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import AIGenerationHistoryModal from './components/question-bank/AIGenerationHistoryModal'
import AIQuestionGeneratorModal from './components/question-bank/AIQuestionGeneratorModal'
import QuestionDetailModal from './components/question-bank/QuestionDetailModal'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import type { Question, QuestionType } from './types/teacher-question-bank.types'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'

const questionTypeBadge: Record<QuestionType, { label: string; className: string }> = {
  SINGLE_CHOICE: {
    label: 'Trắc nghiệm 1 đáp án',
    className: 'bg-blue-100/80 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
  MULTIPLE_CHOICE: {
    label: 'Trắc nghiệm nhiều đáp án',
    className: 'bg-purple-100/80 text-purple-700 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
  TRUE_FALSE: {
    label: 'Đúng / Sai',
    className: 'bg-amber-100/80 text-amber-800 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
  PROGRAMMING: {
    label: 'Lập trình (Code)',
    className: 'bg-emerald-100/80 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
}

const difficultyBadge = {
  EASY: {
    label: 'EASY',
    className: 'bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
  MEDIUM: {
    label: 'MEDIUM',
    className: 'bg-amber-100/80 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
  HARD: {
    label: 'HARD',
    className: 'bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0',
  },
} as const

export default function TeacherQuestionBankPage() {
  const questions = useTeacherWorkspaceStore((state) => state.questions)
  const upsertQuestion = useTeacherWorkspaceStore((state) => state.upsertQuestion)
  const addQuestions = useTeacherWorkspaceStore((state) => state.addQuestions)
  const submitQuestionForReview = useTeacherWorkspaceStore((state) => state.submitQuestionForReview)

  // Tabs state: 'PERSONAL' | 'SHARED'
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SHARED'>('PERSONAL')

  // Filters state
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

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedSubject('ALL')
    setSelectedType('ALL')
    setSelectedDifficulty('ALL')
    setSelectedStatus('ALL')
  }

  const filteredQuestions = questions.filter((q) => {
    // Tab filter
    if (activeTab === 'PERSONAL') {
      if (q.bankScope && q.bankScope !== 'PERSONAL' && q.reviewStatus === 'APPROVED') {
        return false
      }
    } else {
      if (q.bankScope !== 'SHARED' && q.reviewStatus !== 'APPROVED') {
        return false
      }
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'APPROVED' && q.reviewStatus !== 'APPROVED') return false
      if (selectedStatus === 'PENDING_REVIEW' && q.reviewStatus !== 'PENDING_REVIEW') return false
      if (selectedStatus === 'PRIVATE' && q.reviewStatus && q.reviewStatus !== 'PRIVATE') return false
      if (selectedStatus === 'REJECTED' && q.reviewStatus !== 'REJECTED') return false
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
        bankScope: activeTab === 'SHARED' ? 'SHARED' : (savedQuestionData.bankScope || 'PERSONAL'),
        reviewStatus: savedQuestionData.reviewStatus || 'PRIVATE',
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
    submitQuestionForReview(qId)
    alert('Đã gửi yêu cầu đóng góp câu hỏi vào Ngân hàng chung của Bộ môn! Trạng thái: Chờ duyệt.')
  }

  // Restore exact original Table Columns Definition with large clear fonts
  const columns: ColumnDef<Question>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'NỘI DUNG CÂU HỎI',
      render: (q) => (
        <div className="space-y-1 py-1">
          <p className="font-semibold text-gray-900 leading-relaxed text-sm line-clamp-2">
            {q.content}
          </p>
          <p className="text-xs text-blue-600 line-clamp-1">
            {q.subjectName || 'Lập trình Java căn bản'}
          </p>
        </div>
      ),
    },
    {
      header: 'DẠNG CÂU HỎI',
      width: '210px',
      render: (q) => {
        const badge = questionTypeBadge[q.type] || questionTypeBadge.SINGLE_CHOICE
        return <span className={badge.className}>{badge.label}</span>
      },
    },
    {
      header: 'ĐỘ KHÓ',
      width: '100px',
      align: 'center',
      render: (q) => {
        const badge = difficultyBadge[q.difficulty] || difficultyBadge.EASY
        return <span className={badge.className}>{badge.label}</span>
      },
    },
    {
      header: 'PHẠM VI & DUYỆT',
      width: '170px',
      align: 'center',
      render: (q) => {
        const status = q.reviewStatus || 'PRIVATE'
        if (status === 'APPROVED') {
          return (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0">
              Ngân hàng chung
            </span>
          )
        }
        if (status === 'PENDING_REVIEW') {
          return (
            <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0">
              Chờ duyệt
            </span>
          )
        }
        if (status === 'REJECTED') {
          return (
            <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0">
              Bị từ chối
            </span>
          )
        }
        return (
          <span className="bg-gray-100 text-gray-600 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center shrink-0">
            Cá nhân
          </span>
        )
      },
    },
    {
      header: 'THAO TÁC',
      width: '130px',
      align: 'center',
      render: (q) => (
        <div className="flex items-center justify-center gap-1 text-gray-400">
          {(!q.reviewStatus || q.reviewStatus === 'PRIVATE') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShareToSharedBank(q.id)
              }}
              className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Đóng góp vào Ngân hàng chung của Bộ môn"
            >
              <Share2 size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setViewingQuestion(q)
            }}
            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Xem chi tiết câu hỏi"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingQuestion(q)
              setIsEditorOpen(true)
            }}
            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa câu hỏi"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Ngân Hàng Câu Hỏi"
            description="Quản lý, đóng góp và tái sử dụng bộ câu hỏi theo môn học thuộc quyền sở hữu của Giảng viên"
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

          {/* Tabs Switcher: Ngân hàng cá nhân / Ngân hàng chung */}
          <div className="flex items-center justify-between">
            <div className="bg-gray-100 p-1 rounded-2xl inline-flex gap-1">
              <button
                onClick={() => setActiveTab('PERSONAL')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'PERSONAL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                Ngân hàng cá nhân
              </button>
              <button
                onClick={() => setActiveTab('SHARED')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'SHARED'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                Ngân hàng chung
              </button>
            </div>
          </div>

          {/* Compact Filter Bar Without Text Labels */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-3 shrink-0">
              <AppSelect
                value={selectedSubject}
                onChange={(val) => setSelectedSubject(val)}
                className="w-52"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl"
                options={[
                  { value: 'ALL', label: 'Tất cả môn học' },
                  { value: 'sub-01', label: 'Lập trình Java căn bản' },
                  { value: 'sub-02', label: 'Cấu trúc dữ liệu & GT' },
                  { value: 'sub-03', label: 'Lập trình C++' },
                  { value: 'sub-04', label: 'Cơ sở dữ liệu' },
                ]}
              />

              <AppSelect
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                className="w-48"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl"
                options={[
                  { value: 'ALL', label: 'Tất cả dạng câu' },
                  { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm 1 đáp án' },
                  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm nhiều đáp án' },
                  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
                  { value: 'PROGRAMMING', label: 'Lập trình (Code)' },
                ]}
              />

              <AppSelect
                value={selectedDifficulty}
                onChange={(val) => setSelectedDifficulty(val)}
                className="w-36"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl"
                options={[
                  { value: 'ALL', label: 'Mọi độ khó' },
                  { value: 'EASY', label: 'Dễ' },
                  { value: 'MEDIUM', label: 'Trung bình' },
                  { value: 'HARD', label: 'Khó' },
                ]}
              />

              <AppSelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                className="w-44"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl"
                options={[
                  { value: 'ALL', label: 'Trạng thái duyệt' },
                  { value: 'APPROVED', label: 'Đã duyệt' },
                  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
                  { value: 'PRIVATE', label: 'Cá nhân' },
                  { value: 'REJECTED', label: 'Bị từ chối' },
                ]}
              />

              <button
                onClick={handleResetFilters}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-800 rounded-xl transition-colors flex items-center justify-center shrink-0"
                title="Đặt lại tất cả bộ lọc"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 w-64 sm:w-80 shrink-0">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none text-gray-800 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* DataTable direct flat render without outer wrapper box */}
          <DataTable
            columns={columns}
            data={filteredQuestions}
            keyExtractor={(q) => q.id}
            emptyText="Không tìm thấy câu hỏi nào phù hợp với bộ lọc."
          />
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

      <AIGenerationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  )
}
