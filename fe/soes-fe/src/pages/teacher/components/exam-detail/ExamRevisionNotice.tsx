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
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <p className="font-semibold">Đề cần chỉnh sửa trước khi gửi duyệt lại</p>
      {exam.rejectionReason && <p className="mt-1 whitespace-pre-wrap">{exam.rejectionReason}</p>}
      {exam.revisionFeedback && exam.revisionFeedback.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-amber-200 pt-3">
          <p className="font-semibold">Góp ý theo từng câu</p>
          {exam.revisionFeedback.map((feedback) => (
            <div key={feedback.questionId} className="rounded-lg bg-white/70 px-3 py-2">
              <p className="font-semibold">
                Câu {feedback.order}: {feedback.title}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{feedback.note}</p>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate(`/teacher/exams/${exam.id}/edit?step=QUESTIONS`)}
        className="mt-3 font-semibold text-blue-700 underline"
      >
        Mở trình chỉnh sửa đề
      </button>
    </div>
  )
}
