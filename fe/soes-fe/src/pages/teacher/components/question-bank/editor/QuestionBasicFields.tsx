import AppSelect from '../../../../../components/common/AppSelect'
import type { Question, QuestionType } from '../../../types/teacher-question-bank.types'

export const MOCK_SUBJECTS = [
  { id: 'sub-01', name: 'Lập trình Java căn bản' },
  { id: 'sub-02', name: 'Cấu trúc dữ liệu và Giải thuật' },
  { id: 'sub-03', name: 'Lập trình C++' },
  { id: 'sub-04', name: 'Cơ sở dữ liệu' },
]

export function QuestionBasicFields({
  subjectId,
  onSubjectChange,
  questionType,
  onQuestionTypeChange,
  difficulty,
  onDifficultyChange,
  content,
  onContentChange,
  questionTypeOptions,
}: {
  subjectId: string
  onSubjectChange: (id: string) => void
  questionType: QuestionType
  onQuestionTypeChange: (type: QuestionType) => void
  difficulty: Question['difficulty']
  onDifficultyChange: (diff: Question['difficulty']) => void
  content: string
  onContentChange: (val: string) => void
  questionTypeOptions: Array<{ value: QuestionType; label: string }>
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Môn Học</label>
          <AppSelect
            value={subjectId}
            onChange={onSubjectChange}
            buttonClassName="bg-gray-50 text-blue-900"
            menuClassName="z-50"
            options={MOCK_SUBJECTS.map((subject) => ({
              value: subject.id,
              label: subject.name,
            }))}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Dạng Câu Hỏi</label>
          <AppSelect
            value={questionType}
            onChange={onQuestionTypeChange}
            buttonClassName="bg-gray-50"
            menuClassName="z-50"
            options={questionTypeOptions}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Độ Khó</label>
          <AppSelect
            value={difficulty}
            onChange={onDifficultyChange}
            buttonClassName="bg-gray-50"
            menuClassName="z-50"
            options={[
              { value: 'EASY', label: 'Dễ (Nhận biết)' },
              { value: 'MEDIUM', label: 'Trung bình (Thông hiểu)' },
              { value: 'HARD', label: 'Khó (Vận dụng)' },
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Nội Dung Câu Hỏi *</label>
        <textarea
          rows={3}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Nhập nội dung đề bài tại đây..."
          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-gray-800"
        />
      </div>
    </div>
  )
}
