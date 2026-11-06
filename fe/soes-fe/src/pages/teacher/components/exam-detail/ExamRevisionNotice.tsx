import { ArrowRight, MessageSquareText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Exam } from '../../types/teacher-exam.types'

interface ExamRevisionNoticeProps {
  exam: Exam
  isCourseSubmissionView: boolean
}

export function ExamRevisionNotice({ exam, isCourseSubmissionView }: ExamRevisionNoticeProps) {
  const navigate = useNavigate()

  if (
    isCourseSubmissionView ||
    exam.category !== 'FINAL' ||
    exam.status !== 'REJECTED' ||
    (!exam.rejectionReason && !exam.revisionFeedback?.length)
  ) {
    return null
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MessageSquareText size={18} /></span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Đề cần chỉnh sửa trước khi gửi duyệt lại</h2>
          <p className="mt-1 text-xs text-slate-500">Xem góp ý của nhóm duyệt và cập nhật từng câu hỏi trước khi nộp lại.</p>
        </div>
      </div>
      {exam.rejectionReason && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{exam.rejectionReason}</p>}
      {exam.revisionFeedback && exam.revisionFeedback.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Góp ý theo từng câu</p>
          {exam.revisionFeedback.map((feedback) => (
            <div key={feedback.questionId} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">Câu {feedback.order}: {feedback.title}</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">{feedback.note}</p>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate(`/teacher/exams/${exam.id}/edit?step=QUESTIONS`)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
      >
        Mở trình chỉnh sửa đề <ArrowRight size={14} />
      </button>
    </section>
  )
}
