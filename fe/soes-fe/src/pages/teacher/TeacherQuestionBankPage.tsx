import {
  Clock,
  Edit,
  Eye,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import AIGenerationHistoryModal from './components/question-bank/AIGenerationHistoryModal'
import AIQuestionGeneratorModal from './components/question-bank/AIQuestionGeneratorModal'
import QuestionDetailModal from './components/question-bank/QuestionDetailModal'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import { MOCK_QUESTION_BANK } from './mock/teacher-question-bank.mock'
import type { Question, QuestionType } from './types/teacher-question-bank.types'

const questionTypeLabel: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm 1 đáp án',
  MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình (Code)',
}

const difficultyTone = {
  EASY: 'emerald',
  MEDIUM: 'amber',
  HARD: 'rose',
} as const

export default function TeacherQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTION_BANK)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL')

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
  }

  const filteredQuestions = questions.filter((q) => {
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
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id ? ({ ...q, ...savedQuestionData } as Question) : q,
        ),
      )
    } else {
      const newQuestion: Question = {
        id: `q-${Date.now()}`,
        subjectId: savedQuestionData.subjectId || 'sub-01',
        subjectName: savedQuestionData.subjectName || 'Lập trình Java căn bản',
        teacherId: 'gv-01',
        teacherName: 'TS. Nguyễn Văn Giảng',
        bankScope: savedQuestionData.bankScope || 'PERSONAL',
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
      setQuestions([newQuestion, ...questions])
    }
    setEditingQuestion(null)
  }

  const handleShareToSharedBank = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              bankScope: 'SHARED',
              reviewStatus: 'PENDING_REVIEW',
            }
          : q,
      ),
    )
    alert('Đã gửi yêu cầu đóng góp câu hỏi vào Ngân hàng chung của Bộ môn! Trạng thái: Chờ duyệt.')
  }

  // Table Columns Definition
  const columns: ColumnDef<Question>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Nội dung câu hỏi',
      render: (q) => (
        <div className="space-y-1 py-1">
          <p className="font-semibold text-gray-900 leading-relaxed text-xs line-clamp-2">
            {q.content}
          </p>
          <p className="text-[11px] text-blue-600 font-medium line-clamp-1">
            {q.subjectName || 'Lập trình Java'}
          </p>
        </div>
      ),
    },
    {
      header: 'Dạng câu hỏi',
      width: '160px',
      render: (q) => (
        <AppBadge shape="rounded" className="py-1 text-xs font-medium">
          {questionTypeLabel[q.type]}
        </AppBadge>
      ),
    },
    {
      header: 'Độ khó',
      width: '90px',
      align: 'center',
      render: (q) => (
        <AppBadge tone={difficultyTone[q.difficulty]}>{q.difficulty}</AppBadge>
      ),
    },
    {
      header: 'Phạm vi & Duyệt',
      width: '140px',
      align: 'center',
      render: (q) => {
        const status = q.reviewStatus || 'PRIVATE'
        const reviewTone =
          status === 'APPROVED'
            ? 'emerald'
            : status === 'PENDING_REVIEW'
            ? 'amber'
            : status === 'REJECTED'
            ? 'rose'
            : 'gray'

        return (
          <AppBadge tone={reviewTone} shape="rounded" className="py-1 text-[11px]">
            {status === 'APPROVED'
              ? 'Ngân hàng chung'
              : status === 'PENDING_REVIEW'
              ? 'Chờ duyệt'
              : status === 'REJECTED'
              ? 'Bị từ chối'
              : 'Cá nhân'}
          </AppBadge>
        )
      },
    },
    {
      header: 'Thao tác',
      width: '130px',
      align: 'center',
      render: (q) => (
        <div className="flex items-center justify-center gap-1">
          {(!q.reviewStatus || q.reviewStatus === 'PRIVATE') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShareToSharedBank(q.id)
              }}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Đóng góp vào Ngân hàng chung của Bộ môn"
            >
              <Share2 size={15} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setViewingQuestion(q)
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Xem chi tiết câu hỏi"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingQuestion(q)
              setIsEditorOpen(true)
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa câu hỏi"
          >
            <Edit size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
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
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock size={15} />
                  Lịch sử AI
                </button>

                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  <Sparkles size={15} className="text-amber-500" />
                  AI Bóc Tách Đề (PDF / Word)
                </button>

                <button
                  onClick={() => {
                    setEditingQuestion(null)
                    setIsEditorOpen(true)
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Thêm Câu Hỏi Mới
                </button>
              </>
            }
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <Filter size={15} className="text-gray-400 shrink-0" />
                <span className="text-xs font-bold text-gray-700">Môn học:</span>
                <AppSelect
                  value={selectedSubject}
                  onChange={(val) => setSelectedSubject(val)}
                  className="w-52"
                  buttonClassName="bg-blue-50/70 border-blue-200 text-blue-900 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Tất cả môn học' },
                    { value: 'sub-01', label: 'Lập trình Java căn bản' },
                    { value: 'sub-02', label: 'Cấu trúc dữ liệu & GT' },
                    { value: 'sub-03', label: 'Lập trình C++' },
                    { value: 'sub-04', label: 'Cơ sở dữ liệu' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700">Dạng câu:</span>
                <AppSelect
                  value={selectedType}
                  onChange={(val) => setSelectedType(val)}
                  className="w-48"
                  buttonClassName="bg-gray-50 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Tất cả dạng câu' },
                    { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm 1 đáp án' },
                    { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm nhiều đáp án' },
                    { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
                    { value: 'PROGRAMMING', label: 'Lập trình (Code)' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700">Độ khó:</span>
                <AppSelect
                  value={selectedDifficulty}
                  onChange={(val) => setSelectedDifficulty(val)}
                  className="w-36"
                  buttonClassName="bg-gray-50 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Mọi độ khó' },
                    { value: 'EASY', label: 'Dễ' },
                    { value: 'MEDIUM', label: 'Trung bình' },
                    { value: 'HARD', label: 'Khó' },
                  ]}
                />
              </div>

              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shrink-0"
                title="Đặt lại tất cả bộ lọc"
              >
                <RotateCcw size={13} /> Làm mới
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 w-48 sm:w-60 lg:w-72 shrink-0">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none text-gray-800 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* DataTable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <DataTable
              columns={columns}
              data={filteredQuestions}
              keyExtractor={(q) => q.id}
              emptyText="Không tìm thấy câu hỏi nào phù hợp với bộ lọc."
            />
          </div>
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
            bankScope: 'PERSONAL',
            reviewStatus: 'PRIVATE',
            type: d.type,
            difficulty: d.difficulty,
            content: d.content,
            explanation: d.explanation,
            options: d.options,
            createdAt: 'Vừa xong (AI)',
          }))
          setQuestions([...converted, ...questions])
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
