import { CheckCircle2, Eye, ShieldCheck, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import type { Exam } from './types/teacher-exam.types'
import type { Question } from './types/teacher-question-bank.types'

type ApprovalItem =
  | { kind: 'QUESTION'; id: string; title: string; subjectName: string; authorId: string; source: Question }
  | { kind: 'EXAM'; id: string; title: string; subjectName: string; authorId: string; source: Exam }

export default function TeacherDepartmentApprovalPage() {
  const user = useAuthStore((state) => state.user)
  const questions = useTeacherWorkspaceStore((state) => state.questions)
  const exams = useTeacherWorkspaceStore((state) => state.exams)
  const reviewQuestion = useTeacherWorkspaceStore((state) => state.reviewQuestion)
  const reviewExam = useTeacherWorkspaceStore((state) => state.reviewExam)
  const canApprove = user?.permissions?.some((permission) =>
    permission === 'APPROVE_FINAL_EXAM' || permission === 'APPROVE_SHARED_QUESTION',
  )
  const [activeKind, setActiveKind] = useState<'QUESTION' | 'EXAM'>('QUESTION')
  const [reviewing, setReviewing] = useState<ApprovalItem | null>(null)
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  if (!canApprove) {
    return (
      <TeacherShell>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-xs text-amber-800">
          Tài khoản này không có quyền duyệt chuyên môn của Bộ môn.
        </div>
      </TeacherShell>
    )
  }

  const questionItems: ApprovalItem[] = questions
    .filter((question) => question.reviewStatus === 'PENDING_REVIEW')
    .map((question) => ({
      kind: 'QUESTION', id: question.id, title: question.content,
      subjectName: question.subjectName, authorId: question.teacherId, source: question,
    }))
  const examItems: ApprovalItem[] = exams
    .filter((exam) => exam.status === 'PENDING_APPROVAL')
    .map((exam) => ({
      kind: 'EXAM', id: exam.id, title: exam.title,
      subjectName: exam.subjectName, authorId: exam.authorId, source: exam,
    }))
  const items = activeKind === 'QUESTION' ? questionItems : examItems

  const approve = (item: ApprovalItem) => {
    if (item.authorId === user?.profileId) {
      toast.error('Không thể tự duyệt nội dung do chính mình tạo.')
      return
    }
    if (item.kind === 'EXAM') reviewExam(item.id, true)
    else reviewQuestion(item.id, true)
    setReviewing(null)
    toast.success(item.kind === 'EXAM' ? 'Đã duyệt đề thi cuối kỳ.' : 'Đã đưa câu hỏi vào ngân hàng chung.')
  }

  const reject = () => {
    if (!rejecting || rejectionReason.trim().length < 5) return
    if (rejecting.kind === 'EXAM') reviewExam(rejecting.id, false, rejectionReason.trim())
    else reviewQuestion(rejecting.id, false, rejectionReason.trim())
    setRejecting(null)
    setRejectionReason('')
    toast.success('Đã từ chối và gửi lý do cho tác giả.')
  }

  const columns: ColumnDef<ApprovalItem>[] = [
    { header: 'Nội dung', render: (item) => <div className="max-w-xl py-1"><p className="font-semibold text-gray-900 text-sm leading-relaxed line-clamp-2">{item.title}</p><p className="text-xs text-blue-600 mt-0.5">{item.subjectName}</p></div> },
    { header: 'Loại', width: '150px', render: (item) => <AppBadge tone="blue" className="whitespace-nowrap">{item.kind === 'EXAM' ? 'Đề cuối kỳ' : 'Câu hỏi chung'}</AppBadge> },
    { header: 'Thao tác', width: '170px', align: 'right', render: (item) => <div className="flex justify-end gap-1 text-gray-400"><button title="Xem nội dung" onClick={() => setReviewing(item)} className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Eye size={17}/></button><button title="Duyệt" onClick={() => approve(item)} className="p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><CheckCircle2 size={17}/></button><button title="Từ chối" onClick={() => setRejecting(item)} className="p-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"><XCircle size={17}/></button></div> },
  ]

  return (
    <TeacherShell>
      <TeacherPageHeader title="Duyệt chuyên môn" description="Duyệt câu hỏi dùng chung và đề thi cuối kỳ trong phạm vi Bộ môn" />
      <div className="bg-gray-100 p-1 rounded-2xl inline-flex gap-1">
        <Tab active={activeKind === 'QUESTION'} onClick={() => setActiveKind('QUESTION')}>Câu hỏi chung</Tab>
        <Tab active={activeKind === 'EXAM'} onClick={() => setActiveKind('EXAM')}>Đề thi cuối kỳ</Tab>
      </div>
      <DataTable columns={columns} data={items} keyExtractor={(item) => item.id} emptyText="Không có nội dung đang chờ duyệt." />

      {reviewing && <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onApprove={() => approve(reviewing)} onReject={() => { setRejecting(reviewing); setReviewing(null) }} />}
      {rejecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">Từ chối nội dung</h2><button onClick={() => setRejecting(null)} aria-label="Đóng"><X size={18}/></button></div>
            <div className="p-5"><label className="text-xs font-semibold text-gray-700">Lý do từ chối</label><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-blue-500" /></div>
            <div className="flex justify-end gap-2 border-t border-gray-100 p-4"><button onClick={() => setRejecting(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700">Hủy</button><button disabled={rejectionReason.trim().length < 5} onClick={reject} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Xác nhận từ chối</button></div>
          </div>
        </div>
      )}
    </TeacherShell>
  )
}

function TeacherShell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-screen bg-gray-50"><TeacherSidebar/><div className="flex min-w-0 flex-1 flex-col"><TeacherTopBar/><main className="flex-1 space-y-5 overflow-y-auto px-8 py-6">{children}</main></div></div>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
      }`}
    >
      {children}
    </button>
  )
}

function ReviewModal({ item, onClose, onApprove, onReject }: { item: ApprovalItem; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const exam = item.kind === 'EXAM' ? item.source : null
  const question = item.kind === 'QUESTION' ? item.source : null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden"><div className="flex items-center justify-between border-b border-gray-100 p-5"><div className="flex items-center gap-2.5"><ShieldCheck className="text-blue-600" size={22}/><h2 className="text-lg font-bold text-gray-900">Xem nội dung duyệt chuyên môn</h2></div><button onClick={onClose} aria-label="Đóng"><X size={18}/></button></div><div className="flex-1 space-y-4 overflow-y-auto p-6"><AppBadge tone="blue">{item.subjectName}</AppBadge><h3 className="text-base font-bold text-gray-900">{item.title}</h3>{exam && <><p className="text-xs text-gray-600">{exam.description}</p><p className="text-xs">{exam.questions.length} câu • {exam.totalPoints} điểm • {exam.defaultDurationMinutes} phút</p></>}{question?.options?.map((option) => <div key={option.id} className={`rounded-xl border p-3.5 text-xs ${option.isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold' : 'border-gray-200 text-gray-700'}`}>{option.content}</div>)}</div><div className="flex justify-end gap-2 border-t border-gray-100 p-4"><button onClick={onReject} className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">Từ chối</button><button onClick={onApprove} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs">Duyệt chuyên môn</button></div></div></div>
}
