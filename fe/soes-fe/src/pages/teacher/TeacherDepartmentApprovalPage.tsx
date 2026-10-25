import {
  Check,
  CheckCircle2,
  Eye,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import HtmlContent from '../../components/common/HtmlContent'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherApprovals } from './hooks/useTeacherApprovals'
import { getExamApprovalDetail } from './api/teacher-approvals.api'
import { getReviewGroup } from './api/teacher-review-groups.api'
import { toReviewExam } from './mappers/teacher-review-snapshot.mapper'
import type { Exam } from './types/teacher-exam.types'
import type { Question } from './types/teacher-question-bank.types'
import { formatDateTime } from '../../utils/date.utils'

type ApprovalKind = 'QUESTION' | 'EXAM'

type ApprovalItem =
  | {
      kind: 'QUESTION'
      id: string
      title: string
      subjectName: string
      authorId: string
      authorName: string
      createdAt: string
      source: Question
    }
  | {
      kind: 'EXAM'
      id: string
      title: string
      subjectName: string
      authorId: string
      authorName: string
      createdAt: string
      version: number
      source: Exam
    }

const questionTypeLabel = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
} as const

const difficultyLabel = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
} as const

const examCategoryLabel = {
  QUIZ: 'Quiz',
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
} as const

export default function TeacherDepartmentApprovalPage() {
  const user = useAuthStore((state) => state.user)
  const groupQuery = useQuery({ queryKey: ['teacher', 'review-group'], queryFn: getReviewGroup, retry: false })
  const canReviewExams = Boolean(groupQuery.data?.status === 'ACTIVE'
    && groupQuery.data.members.some((member) => member.teacherId === user?.profileId))
  const canReviewQuestions = canReviewExams
  const approvals = useTeacherApprovals(canReviewQuestions, canReviewExams)

  const [selectedKind, setSelectedKind] = useState<ApprovalKind>('QUESTION')
  const activeKind = canReviewQuestions && (selectedKind === 'QUESTION' || !canReviewExams) ? 'QUESTION' : 'EXAM'
  const [reviewing, setReviewing] = useState<ApprovalItem | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({})

  const questionItems: ApprovalItem[] = approvals.questions
    .map(({ itemId, question }) => ({
      kind: 'QUESTION',
      id: itemId,
      title: question.title,
      subjectName: question.subjectName,
      authorId: question.teacherId,
      authorName: question.teacherName,
      createdAt: question.createdAt,
      source: question,
    }))

  const examItems: ApprovalItem[] = approvals.exams
    .map((exam) => ({
      kind: 'EXAM',
      id: exam.id,
      title: exam.title,
      subjectName: exam.subjectName,
      authorId: exam.authorId,
      authorName: exam.authorName,
      createdAt: exam.reviewRound.submittedAt,
      version: exam.reviewRound.version,
      source: exam,
    }))

  const activeItems = activeKind === 'QUESTION' ? questionItems : examItems

  const columns: ColumnDef<ApprovalItem>[] = [
    {
      header: 'Nội dung',
      width: '42%',
      render: (item) => (
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.title}</p>
          <p className="mt-1 text-xs text-gray-500">{item.kind === 'EXAM' ? `Đề thi cuối kỳ · Lần gửi ${item.version}` : 'Câu hỏi dùng chung'}</p>
        </div>
      ),
    },
    {
      header: 'Môn',
      width: '16%',
      render: (item) => <span className="text-sm font-normal text-gray-700">{item.subjectName}</span>,
    },
    {
      header: 'Người gửi',
      width: '18%',
      render: (item) => <span className="text-sm font-normal text-gray-700">{item.authorName}</span>,
    },
    {
      header: 'Ngày gửi',
      width: '14%',
      render: (item) => <span className="text-sm font-normal text-gray-600">{formatDateTime(item.createdAt)}</span>,
    },
    {
      header: 'Thao tác',
      align: 'right',
      width: '10%',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => void openReview(item)}
            disabled={openingId === item.id}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label="Xem nội dung"
            title="Xem nội dung"
          >
            <Eye size={17} />
          </button>
          <button
            onClick={() => approve(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Duyệt"
            title="Duyệt"
          >
            <CheckCircle2 size={17} />
          </button>
          <button
            onClick={() => void openReject(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label={item.kind === 'EXAM' ? 'Yêu cầu sửa' : 'Từ chối'}
            title={item.kind === 'EXAM' ? 'Yêu cầu sửa' : 'Từ chối'}
          >
            <XCircle size={17} />
          </button>
        </div>
      ),
    },
  ]

  const openReview = async (item: ApprovalItem) => {
    if (item.kind === 'QUESTION') {
      setReviewing(item)
      return
    }
    setOpeningId(item.id)
    try {
      const detail = await getExamApprovalDetail(item.id)
      setReviewing({ ...item, source: toReviewExam(detail), version: detail.reviewRound.version })
    } catch {
      toast.error('Không thể tải phiên bản đề đã gửi duyệt. Vui lòng thử lại.')
    } finally {
      setOpeningId(null)
    }
  }

  const openReject = async (item: ApprovalItem) => {
    if (item.kind === 'QUESTION' || item.source.questions.length) {
      setRejecting(item)
      return
    }
    setOpeningId(item.id)
    try {
      const detail = await getExamApprovalDetail(item.id)
      setRejecting({ ...item, source: toReviewExam(detail), version: detail.reviewRound.version })
    } catch {
      toast.error('Không thể tải câu hỏi của phiên bản đề đã gửi duyệt.')
    } finally {
      setOpeningId(null)
    }
  }

  const approve = async (item: ApprovalItem) => {
    try {
      if (item.kind === 'EXAM') await approvals.approveExam(item.id)
      else await approvals.approveQuestion(item.id)
      setReviewing(null)
      toast.success(item.kind === 'EXAM' ? 'Đã duyệt đề thi cuối kỳ.' : 'Đã đưa câu hỏi vào ngân hàng chung.')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('Nội dung đã được xử lý trước. Danh sách đang được tải lại.')
        void approvals.retry()
      } else {
        toast.error('Nội dung đã thay đổi trạng thái hoặc bạn không có quyền duyệt.')
      }
    }
  }

  const reject = async () => {
    if (!rejecting || rejectionReason.trim().length < 5) return
    try {
      if (rejecting.kind === 'EXAM') await approvals.rejectExam(rejecting.id, rejectionReason.trim(),
        Object.entries(questionNotes)
          .filter(([, note]) => note.trim())
          .map(([questionId, note]) => ({ questionId, note: note.trim() })))
      else await approvals.rejectQuestion(rejecting.id, rejectionReason.trim())
      setRejecting(null)
      setRejectionReason('')
      setQuestionNotes({})
      toast.success(rejecting.kind === 'EXAM' ? 'Đã yêu cầu tác giả sửa đề.' : 'Đã từ chối câu hỏi và gửi lý do cho tác giả.')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('Nội dung đã được xử lý trước. Danh sách đang được tải lại.')
        void approvals.retry()
      } else {
        toast.error('Nội dung đã được xử lý hoặc bạn không còn quyền duyệt.')
      }
    }
  }

  if (!canReviewQuestions && !canReviewExams) {
    return (
      <TeacherShell>
        <TeacherPageHeader
          title="Duyệt chuyên môn"
          description="Chỉ thành viên đang hoạt động của nhóm duyệt bộ môn được xử lý câu hỏi và đề thi"
          icon={<ShieldCheck size={21} />}
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          {groupQuery.isLoading ? 'Đang kiểm tra quyền duyệt...' : 'Bạn chưa là thành viên đang hoạt động của nhóm duyệt bộ môn.'}
        </div>
      </TeacherShell>
    )
  }

  return (
    <TeacherShell>
      <TeacherPageHeader
        title="Duyệt chuyên môn"
        description="Thành viên nhóm duyệt bộ môn xử lý câu hỏi dùng chung và đề cuối kỳ sau khi tác giả gửi duyệt."
        icon={<ShieldCheck size={21} />}
      />

      <div className="inline-flex w-full max-w-md rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100">
        {canReviewQuestions && <Tab active={activeKind === 'QUESTION'} onClick={() => setSelectedKind('QUESTION')}>
          Câu hỏi chờ duyệt ({questionItems.length})
        </Tab>}
        {canReviewExams && <Tab active={activeKind === 'EXAM'} onClick={() => setSelectedKind('EXAM')}>
          Đề cuối kỳ ({examItems.length})
        </Tab>}
      </div>

      <DataTable
        columns={columns}
        data={approvals.loading ? [] : activeItems}
        keyExtractor={(item) => item.id}
        emptyText="Không có nội dung đang chờ duyệt."
      />
      {approvals.error && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{approvals.error}</span>
          <button type="button" onClick={() => void approvals.retry()} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          onApprove={() => approve(reviewing)}
          onReject={() => {
            setRejecting(reviewing)
            setReviewing(null)
          }}
        />
      )}

      {rejecting && (
        <RejectModal
          item={rejecting}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          questionNotes={questionNotes}
          onQuestionNoteChange={(questionId, note) => setQuestionNotes((current) => ({ ...current, [questionId]: note }))}
          onClose={() => {
            setRejecting(null)
            setRejectionReason('')
            setQuestionNotes({})
          }}
          onSubmit={reject}
        />
      )}
    </TeacherShell>
  )
}

function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function ReviewModal({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: ApprovalItem
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const exam = item.kind === 'EXAM' ? item.source : null
  const question = item.kind === 'QUESTION' ? item.source : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Xem nội dung duyệt chuyên môn</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {item.kind === 'EXAM' ? `Đề thi cuối kỳ · Lần gửi ${item.version}` : 'Câu hỏi dùng chung'} • {item.subjectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
          {exam && <ExamReviewContent exam={exam} />}
          {question && <QuestionReviewContent question={question} />}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-white p-4">
          <button
            onClick={onReject}
            className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            {item.kind === 'EXAM' ? 'Yêu cầu sửa' : 'Từ chối'}
          </button>
          <button
            onClick={onApprove}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
          >
            Duyệt chuyên môn
          </button>
        </div>
      </div>
    </div>
  )
}

function ExamReviewContent({ exam }: { exam: Exam }) {
  const orderedQuestions = exam.questions.slice().sort((a, b) => a.order - b.order)
  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <PreviewStat label="Loại bài thi" value={examCategoryLabel[exam.category ?? 'FINAL']} />
        <PreviewStat label="Tổng câu" value={exam.questions.length} />
        <PreviewStat label="Thời lượng" value={`${exam.defaultDurationMinutes} phút`} />
        <PreviewStat label="Tổng điểm" value={`${exam.totalPoints} điểm`} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-100">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{exam.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{exam.description}</p>
        </div>
        <div className="h-full divide-y divide-gray-100 overflow-y-auto pb-12">
          {orderedQuestions.map((item) => (
            <div key={`${exam.id}-${item.questionId}-${item.order}`} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-blue-600">Câu {item.order}</span>
                <AppBadge tone={item.question.type === 'PROGRAMMING' ? 'emerald' : 'blue'} shape="rounded">
                  {questionTypeLabel[item.question.type]}
                </AppBadge>
                <AppBadge tone="gray" shape="rounded">
                  {difficultyLabel[item.question.difficulty]}
                </AppBadge>
                <AppBadge tone="amber" shape="rounded">
                  {item.points} điểm
                </AppBadge>
              </div>
              <HtmlContent content={item.question.content} className="text-sm font-medium leading-7 text-gray-900" />
              <QuestionAnswerBlock question={item.question} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function QuestionReviewContent({ question }: { question: Question }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <PreviewStat label="Môn học" value={question.subjectName} />
        <PreviewStat label="Dạng câu" value={questionTypeLabel[question.type]} />
        <PreviewStat label="Độ khó" value={difficultyLabel[question.difficulty]} />
        <PreviewStat label="Người soạn" value={question.teacherName} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-100 p-5">
        <h4 className="text-base font-semibold text-gray-950">{question.title}</h4>
        <HtmlContent content={question.content} className="mt-2 text-sm font-medium leading-7 text-gray-900" />
        <div className="mt-4">
          <QuestionAnswerBlock question={question} />
        </div>
        {question.explanation && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700">Giải thích</p>
            <p className="mt-1 text-sm leading-6 text-blue-900">{question.explanation}</p>
          </div>
        )}
      </div>
    </>
  )
}

function QuestionAnswerBlock({ question }: { question: Question }) {
  if (question.type === 'PROGRAMMING') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <PreviewStat label="Ngôn ngữ" value={question.programmingLanguage ?? 'JAVA'} />
          <PreviewStat label="Thời gian" value={`${question.timeLimitMs ?? 2000} ms`} />
          <PreviewStat label="Bộ nhớ" value={`${question.memoryLimitMb ?? 256} MB`} />
        </div>
        <div className="rounded-xl border border-gray-100">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
            Test case
          </div>
          <div className="divide-y divide-gray-100">
            {(question.testCases ?? []).map((testCase, index) => (
              <div key={testCase.id} className="grid grid-cols-1 gap-3 p-4 text-xs md:grid-cols-[80px_1fr_1fr_100px]">
                <span className="text-gray-500">#{index + 1}</span>
                <span className="font-mono text-gray-700">Input: {testCase.input || '(rỗng)'}</span>
                <span className="font-mono text-gray-700">Output: {testCase.expectedOutput}</span>
                <AppBadge tone={testCase.isHidden ? 'gray' : 'emerald'} shape="rounded">
                  {testCase.isHidden ? 'Ẩn' : 'Mẫu'}
                </AppBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {(question.options ?? []).map((option) => (
        <div
          key={option.id}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            option.isCorrect
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border-gray-100 bg-gray-50 text-gray-600'
          }`}
        >
          {option.isCorrect && <Check size={14} className="shrink-0" />}
          <span>{option.content}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function RejectModal({
  item,
  reason,
  onReasonChange,
  questionNotes,
  onQuestionNoteChange,
  onClose,
  onSubmit,
}: {
  item: ApprovalItem
  reason: string
  onReasonChange: (value: string) => void
  questionNotes: Record<string, string>
  onQuestionNoteChange: (questionId: string, note: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{item.kind === 'EXAM' ? 'Yêu cầu sửa đề' : 'Từ chối câu hỏi'}</h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.title}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          <label className="text-xs font-semibold text-gray-700">{item.kind === 'EXAM' ? 'Lý do yêu cầu sửa' : 'Lý do từ chối'}</label>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={4}
            placeholder="Nhập lý do để giảng viên chỉnh sửa và gửi duyệt lại..."
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-blue-500"
          />
          {item.kind === 'EXAM' && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-700">Góp ý từng câu (nếu cần)</p>
              {item.source.questions.slice().sort((a, b) => a.order - b.order).map((question) => {
                const questionId = question.snapshotQuestionId ?? question.questionId
                return <label key={questionId} className="block text-xs font-medium text-gray-700">
                  Câu {question.order}: {question.question.title}
                  <textarea
                    value={questionNotes[questionId] ?? ''}
                    onChange={(event) => onQuestionNoteChange(questionId, event.target.value)}
                    maxLength={1000}
                    rows={2}
                    placeholder="Nêu nội dung cần sửa ở câu này"
                    className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
            Hủy
          </button>
          <button
            disabled={reason.trim().length < 5}
            onClick={onSubmit}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {item.kind === 'EXAM' ? 'Gửi yêu cầu sửa' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  )
}
