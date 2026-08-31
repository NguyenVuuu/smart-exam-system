import { examTypeLabel } from '../../../constants/ExamEditorConfig'
import type { ExamQuestionItem, ExamSection, ExamType } from '../../../types/teacher-exam.types'
import { SummaryBox } from '../ExamEditorPrimitives'

export function ExamSummary({
  examType,
  title,
  selectedSubject,
  sections,
  sectionStats,
  questions,
  totalPoints,
  onAutoBalancePoints,
}: {
  examType: ExamType
  title: string
  selectedSubject: { subjectCode: string; subjectName: string }
  sections: ExamSection[]
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  questions: ExamQuestionItem[]
  totalPoints: number
  onAutoBalancePoints?: () => void
}) {
  const isPointsBalanced = Math.abs(totalPoints - 10) < 0.01

  return (
    <aside className="w-full xl:w-[360px] space-y-4 h-fit xl:sticky xl:top-6 font-sans">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-blue-600 tracking-wide">{examTypeLabel[examType]}</p>
          <h2 className="mt-1 truncate text-xs font-bold text-gray-900" title={title}>{title}</h2>
          <p className="mt-0.5 truncate text-xs text-gray-500" title={`${selectedSubject.subjectCode} • ${selectedSubject.subjectName}`}>
            {selectedSubject.subjectCode} • {selectedSubject.subjectName}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryBox label="Phần thi" value={sections.length} />
          <SummaryBox label="Câu hỏi" value={questions.length} />
          <div
            className={`rounded-xl border p-2.5 text-center ${
              isPointsBalanced ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <span className="text-xs text-gray-500 block font-medium">Tổng điểm</span>
            <span className={`text-xs font-bold ${isPointsBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
              {totalPoints.toFixed(1)}/10
            </span>
          </div>
        </div>

        {!isPointsBalanced && questions.length > 0 && onAutoBalancePoints && (
          <button
            type="button"
            onClick={onAutoBalancePoints}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            ⚡ Tự động chia đều cho tròn 10.0đ
          </button>
        )}

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <span className="text-xs font-bold text-gray-700 block">Cơ cấu điểm theo phần:</span>
          {sectionStats.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50/80"
            >
              <span className="text-gray-700 font-medium truncate max-w-[180px]">{section.title}</span>
              <span className="font-bold text-blue-700 shrink-0">
                {section.questionCount} câu • {section.points.toFixed(1)}đ
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
