import {
  CheckCircle2,
  Eye,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherApprovals } from './hooks/useTeacherApprovals'
import { getExamApprovalDetail } from './api/teacher-approvals.api'
import { getReviewGroup } from './api/teacher-review-groups.api'
import { toReviewExam } from './mappers/teacher-review-snapshot.mapper'
import { formatDateTime } from '../../utils/date.utils'
import type { ApprovalItem, ApprovalKind } from './types/teacher-approval.types'
import ApprovalTabs from './components/department-approval/ApprovalTabs'
import ApprovalReviewModal from './components/department-approval/ApprovalReviewModal'
import ApprovalRejectModal from './components/department-approval/ApprovalRejectModal'

export default function TeacherDepartmentApprovalPage() {
  const user = useAuthStore((state) => state.user)
  const groupQuery = useQuery({ queryKey: ['teacher', 'review-group'], queryFn: getReviewGroup, retry: false })
  const canReviewExams = Boolean(
    groupQuery.data?.status === 'ACTIVE'
    && groupQuery.data.members.some((member) => member.teacherId === user?.profileId),
  )
  const canReviewQuestions = canReviewExams
  const approvals = useTeacherApprovals(canReviewQuestions, canReviewExams)

  const [selectedKind, setSelectedKind] = useState<ApprovalKind>('QUESTION')
  const activeKind = canReviewQuestions && (selectedKind === 'QUESTION' || !canReviewExams) ? 'QUESTION' : 'EXAM'
  const [reviewing, setReviewing] = useState<ApprovalItem | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({})

  const questionItems: ApprovalItem[] = approvals.questions.map(({ itemId, question }) => ({
    kind: 'QUESTION',
    id: itemId,
    title: question.title,
    subjectName: question.subjectName,
    authorId: question.teacherId,
    authorName: question.teacherName,
    createdAt: question.createdAt,
    source: question,
  }))

  const examItems: ApprovalItem[] = approvals.exams.map((exam) => ({
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
          <p className="mt-1 text-xs text-gray-500">
            {item.kind === 'EXAM' ? `Đề thi cuối kỳ · Lần gửi ${item.version}` : 'Câu hỏi dùng chung'}
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
            aria-label={item.kind === 'EXAM' ? 'Mở đề để góp ý sửa' : 'Từ chối'}
            title={item.kind === 'EXAM' ? 'Mở đề để góp ý sửa' : 'Từ chối'}
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
      setQuestionNotes({})
      setRejectionReason('')
      setReviewing({ ...item, source: toReviewExam(detail), version: detail.reviewRound.version })
    } catch {
      toast.error('Không thể tải phiên bản đề đã gửi duyệt. Vui lòng thử lại.')
    } finally {
      setOpeningId(null)
    }
  }

  const openReject = async (item: ApprovalItem) => {
    if (item.kind === 'EXAM') {
      await openReview(item)
      return
    }
    setRejecting(item)
  }

  const approve = async (item: ApprovalItem) => {
    if (item.kind === 'EXAM' && Object.values(questionNotes).some((note) => note.trim())) {
      toast.error('Đề đang có góp ý cần sửa. Hãy gửi yêu cầu sửa hoặc xóa các góp ý trước khi duyệt.')
      return
    }
    try {
      if (item.kind === 'EXAM') await approvals.approveExam(item.id)
      else await approvals.approveQuestion(item.id)
      setReviewing(null)
      setQuestionNotes({})
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
    if (!rejecting) return
    const notes = Object.entries(questionNotes)
      .filter(([, note]) => note.trim())
      .map(([questionId, note]) => ({ questionId, note: note.trim() }))
    if (rejecting.kind === 'EXAM' ? notes.length === 0 : rejectionReason.trim().length < 5) return
    try {
      if (rejecting.kind === 'EXAM') await approvals.rejectExam(rejecting.id, notes)
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

      <ApprovalTabs
        activeKind={activeKind}
        onSelectKind={setSelectedKind}
        canReviewQuestions={canReviewQuestions}
        canReviewExams={canReviewExams}
        questionCount={questionItems.length}
        examCount={examItems.length}
      />

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
        <ApprovalReviewModal
          item={reviewing}
          questionNotes={questionNotes}
          onQuestionNoteChange={(questionId, note) => setQuestionNotes((current) => ({ ...current, [questionId]: note }))}
          onClose={() => { setReviewing(null); setQuestionNotes({}); setRejectionReason('') }}
          onApprove={() => approve(reviewing)}
          onReject={() => {
            if (reviewing.kind === 'EXAM' && !Object.values(questionNotes).some((note) => note.trim())) {
              toast.error('Hãy ghi góp ý ở ít nhất một câu trước khi yêu cầu sửa đề.')
              return
            }
            setRejecting(reviewing)
            setReviewing(null)
          }}
        />
      )}

      {rejecting && (
        <ApprovalRejectModal
          item={rejecting}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          questionNotes={questionNotes}
          onClose={() => {
            setRejecting(null)
            if (rejecting.kind === 'EXAM') setReviewing(rejecting)
            else setRejectionReason('')
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
