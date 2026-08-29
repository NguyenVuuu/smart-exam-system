import { CheckCircle2, Database, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppSelect from '../../../../components/common/AppSelect'
import type { ExamType } from '../../types/teacher-exam.types'
import type { Question, QuestionType } from '../../types/teacher-question-bank.types'

interface BankQuestionPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectQuestions: (selectedQuestions: Question[]) => void
  existingQuestionIds: string[]
  examType: ExamType
  questions: Question[]
  targetSubjectId?: string
}

export default function BankQuestionPickerModal(props: BankQuestionPickerModalProps) {
  if (!props.isOpen) return null
  return <BankQuestionPickerModalContent key={props.targetSubjectId ?? 'picker'} {...props} />
}

function BankQuestionPickerModalContent({
  onClose,
  onSelectQuestions,
  existingQuestionIds,
  examType,
  questions,
  targetSubjectId,
}: BankQuestionPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>(targetSubjectId || 'ALL')
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'PERSONAL' | 'SHARED'>('ALL')

  const questionTypeLabel: Record<QuestionType, string> = {
    SINGLE_CHOICE: '1 đáp án đúng',
    MULTIPLE_CHOICE: 'Nhiều đáp án đúng',
    TRUE_FALSE: 'Đúng / Sai',
    PROGRAMMING: 'Lập trình',
  }

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const q of questions) {
      if (q.subjectId) {
        map.set(q.subjectId, q.subjectName || 'Môn học khác')
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [questions])

  // Filter based on Exam Type, Subject, and Scope (Personal / Shared)
  const filteredQuestions = questions.filter((q) => {
    const isAlreadyInExam = existingQuestionIds.includes(q.id)
    const matchesSearch =
      !searchQuery ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subjectName && q.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSubject = selectedSubject === 'ALL' || q.subjectId === selectedSubject
    const matchesScope =
      selectedScope === 'ALL' ||
      (selectedScope === 'SHARED' ? q.bankScope === 'SHARED' : q.bankScope !== 'SHARED')

    let matchesExamType = true
    if (examType === 'MULTIPLE_CHOICE') {
      matchesExamType =
        q.type === 'SINGLE_CHOICE' ||
        q.type === 'MULTIPLE_CHOICE' ||
        q.type === 'TRUE_FALSE'
    } else if (examType === 'PROGRAMMING') {
      matchesExamType = q.type === 'PROGRAMMING'
    } else if (examType === 'MIXED') {
      matchesExamType =
        q.type === 'SINGLE_CHOICE' ||
        q.type === 'MULTIPLE_CHOICE' ||
        q.type === 'TRUE_FALSE' ||
        q.type === 'PROGRAMMING'
    }

    return !isAlreadyInExam && matchesSearch && matchesExamType && matchesSubject && matchesScope
  })

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleSelectAllVisible = () => {
    const visibleIds = filteredQuestions.map((q) => q.id)
    const allSelected = visibleIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
    }
  }

  const handleConfirmAdd = () => {
    const selectedObjList = questions.filter((q) => selectedIds.includes(q.id))
    onSelectQuestions(selectedObjList)
    setSelectedIds([])
    onClose()
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedSubject(targetSubjectId || 'ALL')
    setSelectedScope('ALL')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header cố định */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Chọn Câu Hỏi Từ Ngân Hàng</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Loại đề:{' '}
                <span className="font-semibold text-blue-600">
                  {examType === 'MULTIPLE_CHOICE'
                    ? 'Trắc nghiệm'
                    : examType === 'PROGRAMMING'
                      ? 'Lập trình'
                      : 'Hỗn hợp'}
                </span>
                <span className="mx-2 text-gray-300">|</span>
                Đã chọn:{' '}
                <span className="font-semibold text-emerald-600">{selectedIds.length} câu</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar bộ lọc cố định: Môn học + Phạm vi + Tìm kiếm + Làm mới */}
        <div className="px-6 py-3.5 bg-gray-50/70 border-b border-gray-100 space-y-2.5 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <AppSelect
                value={selectedSubject}
                onChange={setSelectedSubject}
                buttonClassName="bg-white text-xs py-2 shadow-2xs"
                options={[
                  { value: 'ALL', label: 'Tất cả môn học' },
                  ...subjectOptions,
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <AppSelect
                value={selectedScope}
                onChange={(val) => setSelectedScope(val as 'ALL' | 'PERSONAL' | 'SHARED')}
                buttonClassName="bg-white text-xs py-2 shadow-2xs"
                options={[
                  { value: 'ALL', label: 'Tất cả phạm vi' },
                  { value: 'PERSONAL', label: 'Ngân hàng cá nhân' },
                  { value: 'SHARED', label: 'Ngân hàng chung' },
                ]}
              />
            </div>

            <div className="sm:col-span-4 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-2xs relative">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden w-full pr-4"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-1">
              <button
                onClick={handleResetFilters}
                className="w-full h-full py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1 shrink-0"
                title="Làm mới bộ lọc"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Dòng chọn nhanh và thống kê */}
          {filteredQuestions.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {filteredQuestions.every((q) => selectedIds.includes(q.id))
                  ? 'Bỏ chọn tất cả'
                  : 'Chọn tất cả câu hỏi hiển thị'}
              </button>
              <span>Tìm thấy {filteredQuestions.length} câu hỏi phù hợp</span>
            </div>
          )}
        </div>

        {/* Danh sách câu hỏi cuộn trọn vẹn trong khung modal (flex-1 overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 min-h-0 bg-gray-50/30">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Database size={36} className="text-gray-300 mb-2" />
              <p className="text-xs font-medium text-gray-500">
                Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isChecked = selectedIds.includes(q.id)
              return (
                <label
                  key={q.id}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer block space-y-1.5 ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                      : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-md">
                          {q.type === 'PROGRAMMING'
                            ? `Lập trình ${q.programmingLanguage}`
                            : questionTypeLabel[q.type]}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                            q.bankScope === 'SHARED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {q.bankScope === 'SHARED' ? 'Ngân hàng chung' : 'Cá nhân'}
                        </span>
                        <span className="text-xs font-medium text-gray-500">• Môn: {q.subjectName}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                        {q.content}
                      </p>
                    </div>
                  </div>
                </label>
              )
            })
          )}
        </div>

        {/* Footer cố định ở đáy */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            Đã chọn: <strong className="text-gray-900">{selectedIds.length}</strong> câu hỏi
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              disabled={selectedIds.length === 0}
              onClick={handleConfirmAdd}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Thêm {selectedIds.length} câu hỏi đã chọn vào Đề thi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
