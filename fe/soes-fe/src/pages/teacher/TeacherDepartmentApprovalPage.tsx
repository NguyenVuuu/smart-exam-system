import {
  Check,
  CheckCircle2,
  Eye,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherApprovals } from './hooks/useTeacherApprovals'
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
  const canApprove = user?.permissions?.some((permission) =>
    permission === 'APPROVE_FINAL_EXAM' || permission === 'APPROVE_SHARED_QUESTION',
  )
  const approvals = useTeacherApprovals(Boolean(canApprove))

  const [activeKind, setActiveKind] = useState<ApprovalKind>('QUESTION')
  const [reviewing, setReviewing] = useState<ApprovalItem | null>(null)
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

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
      createdAt: exam.createdAt,
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
          <p className="mt-1 text-xs text-gray-500">
            {item.kind === 'EXAM' ? 'Đề thi cuối kỳ' : 'Câu hỏi dùng chung'}
          </p>
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
            onClick={() => setReviewing(item)}
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
            onClick={() => setRejecting(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label="Từ chối"
            title="Từ chối"
          >
            <XCircle size={17} />
          </button>
        </div>
      ),
    },
  ]

  const approve = async (item: ApprovalItem) => {
    if (item.authorId === user?.profileId) {
      toast.error('Không thể tự duyệt nội dung do chính mình tạo.')
      return
    }
    try {
      if (item.kind === 'EXAM') await approvals.approveExam(item.id)
      else await approvals.approveQuestion(item.id)
      setReviewing(null)
      toast.success(item.kind === 'EXAM' ? 'Đã duyệt đề thi cuối kỳ.' : 'Đã đưa câu hỏi vào ngân hàng chung.')
    } catch { toast.error('Nội dung đã thay đổi trạng thái hoặc bạn không có quyền duyệt.') }
  }

  const reject = async () => {
    if (!rejecting || rejectionReason.trim().length < 5) return
    try {
      if (rejecting.kind === 'EXAM') await approvals.rejectExam(rejecting.id, rejectionReason.trim())
      else await approvals.rejectQuestion(rejecting.id, rejectionReason.trim())
      setRejecting(null)
      setRejectionReason('')
      toast.success('Đã từ chối và gửi lý do cho tác giả.')
    } catch { toast.error('Không thể từ chối nội dung ở trạng thái hiện tại.') }
  }

  if (!canApprove) {
    return (
      <TeacherShell>
        <TeacherPageHeader
          title="Duyệt chuyên môn"
          description="Chỉ Trưởng bộ môn hoặc người được ủy quyền mới truy cập được màn hình này"
          icon={<ShieldCheck size={21} />}
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Tài khoản này không có quyền duyệt chuyên môn của Bộ môn.
        </div>
      </TeacherShell>
    )
  }

  return (
    <TeacherShell>
      <TeacherPageHeader
        title="Duyệt chuyên môn"
        description="Duyệt câu hỏi chung và đề cuối kỳ thuộc bộ môn bạn phụ trách. Không thể tự duyệt nội dung do chính mình soạn."
        icon={<ShieldCheck size={21} />}
      />

      <div className="inline-flex w-full max-w-md rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100">
        <Tab active={activeKind === 'QUESTION'} onClick={() => setActiveKind('QUESTION')}>
          Câu hỏi chờ duyệt ({questionItems.length})
        </Tab>
        <Tab active={activeKind === 'EXAM'} onClick={() => setActiveKind('EXAM')}>
          Đề cuối kỳ ({examItems.length})
        </Tab>
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
          onClose={() => {
            setRejecting(null)
            setRejectionReason('')
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
              {item.kind === 'EXAM' ? 'Đề thi cuối kỳ' : 'Câu hỏi dùng chung'} • {item.subjectName}
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
            Từ chối
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
              <p className="text-sm font-semibold text-gray-950">{item.question.title}</p>
              <p className="text-sm font-medium leading-7 text-gray-900">{item.question.content}</p>
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
        <p className="mt-2 text-sm font-medium leading-7 text-gray-900">{question.content}</p>
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
  onClose,
  onSubmit,
}: {
  item: ApprovalItem
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Từ chối nội dung</h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.title}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <label className="text-xs font-semibold text-gray-700">Lý do từ chối</label>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={4}
            placeholder="Nhập lý do để giảng viên chỉnh sửa và gửi duyệt lại..."
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-blue-500"
          />
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
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}
