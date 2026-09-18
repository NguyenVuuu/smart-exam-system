import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import GradeAppealReviewPanel from './components/grade-export/GradeAppealReviewPanel'
import { useTeacherGradeAppealReview } from './hooks/useTeacherGradeAppealReview'

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  IN_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã từ chối',
} as const

const STATUS_TONES = {
  PENDING: 'blue',
  IN_REVIEW: 'amber',
  RESOLVED: 'emerald',
  REJECTED: 'rose',
} as const

export default function TeacherGradeAppealReviewPage() {
  const navigate = useNavigate()
  const { appealId = '' } = useParams()
  const review = useTeacherGradeAppealReview(appealId)
  const backToAppeals = () => navigate('/teacher/grading-reports?tab=appeals')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <button
              type="button"
              onClick={backToAppeals}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
            >
              <ArrowLeft size={17} /> Quay lại Kết quả & Phúc khảo
            </button>

            <TeacherPageHeader
              title="Xem bài & Chấm phúc khảo"
              description={review.appeal
                ? `${review.appeal.student.fullName} · ${review.appeal.student.studentCode} · ${review.appeal.exam.title}`
                : 'Kiểm tra bài nộp và ghi nhận kết luận chấm lại.'}
              icon={<ClipboardCheck size={20} />}
              titleContent={review.appeal ? (
                <AppBadge tone={STATUS_TONES[review.appeal.status]}>
                  {STATUS_LABELS[review.appeal.status]}
                </AppBadge>
              ) : undefined}
            />

            {review.loading && <PageMessage message="Đang tải bài nộp và dữ liệu phúc khảo..." />}
            {!review.loading && review.error && (
              <PageMessage message={review.error} actionLabel="Quay lại danh sách" onAction={backToAppeals} />
            )}
            {!review.loading && !review.error && review.appeal && review.exam && review.submission && (
              <GradeAppealReviewPanel
                appeal={review.appeal}
                exam={review.exam}
                submission={review.submission}
                score={review.score}
                conclusion={review.conclusion}
                saving={review.saving}
                onScoreChange={review.setScore}
                onConclusionChange={review.setConclusion}
                onSave={() => void review.save()}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function PageMessage({
  message,
  actionLabel,
  onAction,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          {actionLabel}
        </button>
      )}
    </section>
  )
}
