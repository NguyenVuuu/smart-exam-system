import { Eye } from 'lucide-react'
import { examTypeLabel } from '../../../constants/ExamEditorConfig'
import type { ExamQuestionItem, ExamSection, ExamType } from '../../../types/teacher-exam.types'
import { StepCard } from '../ExamEditorPrimitives'
import { QuestionAnswerPreview } from '../QuestionRow'

export function StepPreview({
  examType,
  title,
  description,
  sectionStats,
  questions,
}: {
  examType: ExamType
  title: string
  description: string
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  questions: ExamQuestionItem[]
}) {
  const getVariantQuestions = (sectionId: string) => {
    return questions.filter((item) => item.sectionId === sectionId)
  }

  return (
    <StepCard
      title="Xem trước đề thi"
      desc="Kiểm tra nội dung đề và thứ tự câu hỏi trước khi tạo ca thi."
      icon={<Eye size={18} className="text-blue-600" />}
    >
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase">{examTypeLabel[examType]}</p>
            <h2 className="mt-1 truncate text-xs font-semibold text-gray-900" title={title}>{title}</h2>
            <p className="mt-1 truncate text-xs text-gray-500" title={description}>{description}</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium shrink-0">
            Xem thử đề cá nhân
          </span>
        </div>

        {sectionStats.map((section) => (
          <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{section.title}</p>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {section.questionCount} câu • {section.points.toFixed(1)} điểm
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {getVariantQuestions(section.id).map((item, idx) => (
                <div key={item.questionId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                      Câu {idx + 1}. {item.question.title || item.question.content}
                    </p>
                    <span className="text-xs font-bold text-gray-700 shrink-0">{item.points} điểm</span>
                  </div>
                  <QuestionAnswerPreview question={item.question} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StepCard>
  )
}
