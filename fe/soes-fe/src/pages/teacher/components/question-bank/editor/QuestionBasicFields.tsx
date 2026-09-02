import AppSelect from '../../../../../components/common/AppSelect'
import type { Question, QuestionType } from '../../../types/teacher-question-bank.types'
import RichTextEditor from './RichTextEditor'
import type { Editor as TinyMCEEditor } from 'tinymce'

export function QuestionBasicFields({
  subjects,
  subjectId,
  onSubjectChange,
  questionType,
  onQuestionTypeChange,
  difficulty,
  onDifficultyChange,
  title,
  onTitleChange,
  content,
  onContentChange,
  onContentEditorInit,
  questionTypeOptions,
}: {
  subjects: Array<{ id: string; name: string }>
  subjectId: string
  onSubjectChange: (id: string) => void
  questionType: QuestionType
  onQuestionTypeChange: (type: QuestionType) => void
  difficulty: Question['difficulty']
  onDifficultyChange: (diff: Question['difficulty']) => void
  title: string
  onTitleChange: (value: string) => void
  content: string
  onContentChange: (val: string) => void
  onContentEditorInit?: (editor: TinyMCEEditor) => void
  questionTypeOptions: Array<{ value: QuestionType; label: string }>
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Môn Học</label>
          <AppSelect
            value={subjectId}
            onChange={onSubjectChange}
            buttonClassName="bg-gray-50 text-blue-900"
            menuClassName="z-50"
            options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Dạng Câu Hỏi</label>
          <AppSelect
            value={questionType}
            onChange={onQuestionTypeChange}
            buttonClassName="bg-gray-50"
            menuClassName="z-50"
            options={questionTypeOptions}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Độ Khó</label>
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
        <label className="mb-1 block text-xs font-semibold text-gray-700">Tiêu Đề Câu Hỏi *</label>
        <input
          value={title}
          maxLength={200}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={questionType === 'PROGRAMMING' ? 'Ví dụ: Tính tổng hai số nguyên' : 'Nhập câu hỏi trắc nghiệm'}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
        />
      </div>

      {questionType === 'PROGRAMMING' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Mô Tả Bài Toán *</label>
          <RichTextEditor
            value={content}
            onChange={onContentChange}
            onInit={onContentEditorInit}
            placeholder="Mô tả yêu cầu, input, output, ràng buộc và ví dụ của bài lập trình..."
          />
        </div>
      )}
    </div>
  )
}
