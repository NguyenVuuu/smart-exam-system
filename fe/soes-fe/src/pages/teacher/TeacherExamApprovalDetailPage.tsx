import { ArrowLeft, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import axios from 'axios'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import ApprovalRejectModal from './components/department-approval/ApprovalRejectModal'
import { ExamReviewContent } from './components/department-approval/ApprovalReviewModal'
import { approveExam, getExamApprovalDetail, getExamReviewHistory, rejectExam, type ExamApprovalDetailDto, type ExamReviewHistoryItem } from './api/teacher-approvals.api'
import { toReviewExam } from './mappers/teacher-review-snapshot.mapper'
import type { Exam } from './types/teacher-exam.types'
import type { ApprovalItem } from './types/teacher-approval.types'
import { useReviewGroupAccess } from './hooks/useReviewGroupAccess'

export default function TeacherExamApprovalDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const accessQuery = useReviewGroupAccess()
  const [exam, setExam] = useState<Exam | null>(null)
  const [detail, setDetail] = useState<ExamApprovalDetailDto | null>(null)
  const [history, setHistory] = useState<ExamReviewHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({})
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId || accessQuery.data?.canReview !== true) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getExamApprovalDetail(examId), getExamReviewHistory(examId)])
      .then(([detail, reviewHistory]) => {
        if (cancelled) return
        setDetail(detail)
        setExam(toReviewExam(detail))
        setHistory(reviewHistory)
        setSelectedHistoryId(reviewHistory[0]?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải phiên bản đề hoặc bạn không có quyền xem đề này.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [examId, accessQuery.data?.canReview])

  const selectedRound = history.find((round) => round.id === selectedHistoryId) ?? null
  const readOnly = detail?.reviewRound.status === 'APPROVED'
  const finalApproval = history.find((round) => round.decision?.type === 'APPROVE')?.decision ?? null
  const selectedRoundIndex = selectedRound ? history.findIndex((round) => round.id === selectedRound.id) : -1
  const previousRound = selectedRoundIndex >= 0 ? history[selectedRoundIndex + 1] ?? null : null
  const selectedHistoryExam = useMemo(() => {
    if (!detail || !selectedRound) return null
    return toReviewExam({ ...detail, snapshot: selectedRound.snapshot })
  }, [detail, selectedRound])
  const previousHistoryExam = useMemo(() => {
    if (!detail || !previousRound) return null
    return toReviewExam({ ...detail, snapshot: previousRound.snapshot })
  }, [detail, previousRound])

  const approvalItem: ApprovalItem | null = exam ? {
    kind: 'EXAM',
    id: exam.id,
    title: exam.title,
    subjectName: exam.subjectName,
    authorId: exam.authorId,
    authorName: exam.authorName,
    createdAt: history[0]?.submittedAt ?? exam.createdAt,
    version: history[0]?.version ?? 1,
    source: exam,
  } : null

  const notes = Object.entries(questionNotes)
    .filter(([, note]) => note.trim())
    .map(([questionId, note]) => ({ questionId, note: note.trim() }))

  const handleApprove = async () => {
    if (!examId) return
    if (notes.length) {
      toast.error('Đề đang có góp ý cần sửa. Hãy gửi yêu cầu sửa hoặc xóa các góp ý trước khi duyệt.')
      return
    }
    setSaving(true)
    try {
      await approveExam(examId)
      toast.success('Đã duyệt đề thi cuối kỳ.')
      navigate('/teacher/department-approvals')
    } catch (requestError) {
      toast.error(axios.isAxiosError(requestError) && requestError.response?.status === 409
        ? 'Đề đã được người khác xử lý trước.'
        : 'Không thể duyệt đề. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!examId || (!rejectionReason.trim() && !notes.length)) return
    setSaving(true)
    try {
      await rejectExam(examId, rejectionReason, notes)
      toast.success('Đã yêu cầu tác giả sửa đề.')
      navigate('/teacher/department-approvals')
    } catch (requestError) {
      toast.error(axios.isAxiosError(requestError) && requestError.response?.status === 409
        ? 'Đề đã được người khác xử lý trước.'
        : 'Không thể gửi yêu cầu sửa đề.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <TeacherShell>
      <TeacherPageHeader
        title={readOnly ? "L\u1ecbch s\u1eed duy\u1ec7t \u0111\u1ec1" : "Duy\u1ec7t \u0111\u1ec1 thi cu\u1ed1i k\u1ef3"}
        description={readOnly ? "Xem l\u1ea1i c\u00e1c phi\u00ean b\u1ea3n v\u00e0 quy\u1ebft \u0111\u1ecbnh duy\u1ec7t c\u1ee7a \u0111\u1ec1." : "Xem to\u00e0n b\u1ed9 n\u1ed9i dung, l\u1ecbch s\u1eed x\u1eed l\u00fd v\u00e0 g\u1eedi quy\u1ebft \u0111\u1ecbnh duy\u1ec7t chuy\u00ean m\u00f4n."}
        icon={<ShieldCheck size={21} />}
        actions={
          <button type="button" onClick={() => navigate('/teacher/department-approvals')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        }
      />

      {accessQuery.data?.canReview !== true && !accessQuery.isLoading ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Bạn chưa là thành viên đang hoạt động của nhóm duyệt bộ môn.</div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải nội dung đề duyệt...</div>
      ) : error || !exam || !approvalItem ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error ?? "Không tìm thấy đề cần duyệt."}</div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{readOnly ? `L\u1ecbch s\u1eed duy\u1ec7t \u0111\u1ec1 - L\u1ea7n g\u1eedi ${approvalItem.version}` : `Duy\u1ec7t \u0111\u1ec1 thi cu\u1ed1i k\u1ef3 - L\u1ea7n g\u1eedi ${approvalItem.version}`}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{exam.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{exam.subjectName} - {"Ng\u01b0\u1eddi ra \u0111\u1ec1"}: {exam.authorName}</p>
                {readOnly && finalApproval && <p className="mt-1 text-xs font-semibold text-emerald-700">{"\u0110\u01b0\u1ee3c duy\u1ec7t b\u1edfi"} {finalApproval.reviewer.fullName}</p>}
              </div>
              <div className={`rounded-xl px-4 py-3 text-right text-xs ${readOnly ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>
                <p className="font-semibold">{readOnly ? "\u0110\u00e3 duy\u1ec7t" : "\u0110ang ch\u1edd x\u1eed l\u00fd"}</p>
                <p className="mt-1">{exam.questions.length} cau - {exam.totalPoints} diem - {exam.defaultDurationMinutes} phut</p>
              </div>
            </div>
          </section>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setActiveTab("CURRENT")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "CURRENT" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              {readOnly ? "N\u1ed9i dung \u0111\u1ec1 \u0111\u00e3 duy\u1ec7t" : "\u0110\u1ec1 g\u1eedi duy\u1ec7t hi\u1ec7n t\u1ea1i"}
            </button>
            <button type="button" onClick={() => setActiveTab("HISTORY")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "HISTORY" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              {readOnly ? `L\u1ecbch s\u1eed c\u00e1c phi\u00ean b\u1ea3n (${history.length})` : `L\u1ecbch s\u1eed y\u00eau c\u1ea7u s\u1eeda (${history.length})`}
            </button>
          </div>

          {activeTab === 'CURRENT' ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ExamReviewContent
                exam={exam}
                questionNotes={questionNotes}
                onQuestionNoteChange={(questionId, note) => setQuestionNotes((current) => ({ ...current, [questionId]: note }))}
                interactiveNotes={!readOnly}
              />
            </section>
          ) : (
            <HistoryTab
              history={history}
              selectedRound={selectedRound}
              selectedExam={selectedHistoryExam}
              previousExam={previousHistoryExam}
              onSelect={(id) => setSelectedHistoryId(id)}
            />
          )}

          {activeTab === 'CURRENT' && !readOnly && <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <button type="button" disabled={saving} onClick={() => setRejecting(true)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
              <XCircle size={17} /> Yêu cầu sửa đề
            </button>
            <button type="button" disabled={saving || notes.length > 0} onClick={() => void handleApprove()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle2 size={17} /> Duyệt chuyên môn
            </button>
          </div>}
        </div>
      )}

      {rejecting && approvalItem && (
        <ApprovalRejectModal
          item={approvalItem}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          questionNotes={questionNotes}
          onClose={() => setRejecting(false)}
          onSubmit={() => void handleReject()}
        />
      )}
    </TeacherShell>
  )
}

function HistoryTab({
  history,
  selectedRound,
  selectedExam,
  previousExam,
  onSelect,
}: {
  history: ExamReviewHistoryItem[]
  selectedRound: ExamReviewHistoryItem | null
  selectedExam: Exam | null
  previousExam: Exam | null
  onSelect: (id: string) => void
}) {
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('CHANGED')

  return (
    <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
      <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-950">Các lần gửi và xử lý</h3>
          <p className="mt-1 text-xs text-slate-500">Chọn một vòng để xem bản đề và phản hồi tương ứng.</p>
        </div>
        <div className="space-y-2">
          {history.map((round) => {
            const approved = round.status === 'APPROVED' || round.decision?.type === 'APPROVE'
            const revision = round.status === 'REVISION_REQUESTED' || round.decision?.type === 'REQUEST_REVISION'
            return (
              <button key={round.id} type="button" onClick={() => onSelect(round.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedRound?.id === round.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">Lần gửi {round.version}</span>
                  <span className={`text-xs font-semibold ${approved ? 'text-emerald-700' : revision ? 'text-amber-700' : 'text-blue-700'}`}>
                    {approved ? "Đã duyệt" : revision ? "Yêu cầu sửa" : "Đang xử lý"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Gửi bởi {round.submittedBy.fullName}</p>
                <p className="mt-1 text-xs text-slate-400">{formatHistoryDate(round.submittedAt)}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {selectedRound && selectedExam ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chi tiết lần gửi {selectedRound.version}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{selectedExam.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Gửi bởi {selectedRound.submittedBy.fullName} lúc {formatHistoryDate(selectedRound.submittedAt)}</p>
              </div>
              {selectedRound.decision && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">{selectedRound.decision.type === "APPROVE" ? "Đã duyệt" : "Yêu cầu sửa"}</span>}
            </div>

            {selectedRound.decision && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Thông tin yêu cầu xử lý</p>
                <p className="mt-2">Người xử lý: <strong>{selectedRound.decision.reviewer.fullName}</strong></p>
                {selectedRound.decision.reason && <p className="mt-2 whitespace-pre-wrap">Góp ý chung: {selectedRound.decision.reason}</p>}
                {selectedRound.decision.questionFeedback?.length ? (
                  <div className="mt-3 space-y-2">
                    <p className="font-semibold text-slate-900">Góp ý theo câu</p>
                    {selectedRound.decision.questionFeedback.map((feedback) => <p key={feedback.questionId}><strong>Câu {feedback.order}:</strong> {feedback.note}</p>)}
                  </div>
                ) : null}
              </div>
            )}

            <ChangeSummary current={selectedExam} previous={previousExam} />
            <QuestionComparison
              current={selectedExam}
              previous={previousExam}
              currentVersion={selectedRound.version}
              previousVersion={previousRoundVersion(history, selectedRound)}
              filter={changeFilter}
              onFilterChange={setChangeFilter}
            />
          </>
        ) : <p className="text-sm text-slate-500">Chưa có lịch sử xử lý.</p>}
      </section>
    </div>
  )
}

function ChangeSummary({ current, previous }: { current: Exam; previous: Exam | null }) {
  if (!previous) return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Đây là lần gửi đầu tiên, chưa có phiên bản trước để đối chiếu.</div>
  const changes = buildQuestionChanges(current, previous)
  const added = changes.filter((change) => change.kind === "ADDED").length
  const removed = changes.filter((change) => change.kind === "REMOVED").length
  const modified = changes.filter((change) => change.kind === "MODIFIED").length
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Đề đã thay đổi so với lần gửi trước</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <p><strong>{added}</strong> câu được thêm</p>
        <p><strong>{removed}</strong> câu được bỏ</p>
        <p><strong>{modified}</strong> câu được chỉnh sửa</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">Đang xem bản đề của lần gửi đã chọn; bản trước được dùng làm mốc đối chiếu.</p>
    </div>
  )
}

type ChangeFilter = 'ALL' | 'CHANGED' | 'ADDED' | 'REMOVED' | 'MODIFIED'
type QuestionChange = {
  kind: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED'
  current: Exam['questions'][number] | null
  previous: Exam['questions'][number] | null
}

function previousRoundVersion(history: ExamReviewHistoryItem[], selectedRound: ExamReviewHistoryItem) {
  const index = history.findIndex((round) => round.id === selectedRound.id)
  return index >= 0 ? history[index + 1]?.version ?? null : null
}

function QuestionComparison({
  current,
  previous,
  currentVersion,
  previousVersion,
  filter,
  onFilterChange,
}: {
  current: Exam
  previous: Exam | null
  currentVersion: number
  previousVersion: number | null
  filter: ChangeFilter
  onFilterChange: (value: ChangeFilter) => void
}) {
  if (!previous || previousVersion === null) return null
  const changes = buildQuestionChanges(current, previous)
  const visibleChanges = changes.filter((change) => filter === 'ALL'
    ? true
    : filter === 'CHANGED'
      ? change.kind !== 'UNCHANGED'
      : change.kind === filter)
  const filterOptions: Array<{ value: ChangeFilter; label: string }> = [
    { value: "CHANGED", label: "Chỉ thay đổi" },
    { value: "ALL", label: "Tất cả câu" },
    { value: "ADDED", label: "Câu thêm" },
    { value: "REMOVED", label: "Câu xóa" },
    { value: "MODIFIED", label: "Câu sửa" },
  ]
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-950">So sánh nội dung hai phiên bản</h4>
          <p className="mt-1 text-xs text-slate-500">Câu cùng mã được ghép cạnh nhau; câu thêm và câu xóa vẫn được giữ đúng phía phiên bản.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 shadow-sm">
          {filterOptions.map((option) => (
            <button key={option.value} type="button" onClick={() => onFilterChange(option.value)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${filter === option.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Phiên bản đang xem - Lần gửi {currentVersion}</p>
          <p className="mt-1 text-xs text-blue-700">{current.questions.length} câu - {current.totalPoints} điểm</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Phiên bản ngay trước - Lần gửi {previousVersion}</p>
          <p className="mt-1 text-xs text-slate-500">{previous.questions.length} câu - {previous.totalPoints} điểm</p>
        </div>
      </div>
      {visibleChanges.length ? (
        <div className="space-y-4">
          {visibleChanges.map((change, index) => <QuestionChangeRow key={`${change.kind}-${questionKey(change.current ?? change.previous!)}-${index}`} change={change} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Không có câu hỏi phù hợp với bộ lọc này.</div>
      )}
    </section>
  )
}

function QuestionChangeRow({ change }: { change: QuestionChange }) {
  const labels = { ADDED: "Câu thêm mới", REMOVED: "Câu đã xóa", MODIFIED: "Câu đã chỉnh sửa", UNCHANGED: "Không thay đổi" }
  const tone = change.kind === 'ADDED' ? 'border-emerald-200 bg-emerald-50/40' : change.kind === 'REMOVED' ? 'border-rose-200 bg-rose-50/40' : change.kind === 'MODIFIED' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'
  return (
    <div className={`overflow-hidden rounded-xl border ${tone}`}>
      <div className="flex items-center justify-between gap-3 border-b border-inherit px-4 py-2.5">
        <span className="text-xs font-bold text-slate-900">{labels[change.kind]}</span>
        <span className="text-xs text-slate-500">{change.current?.order ?? change.previous?.order ? `Câu ${change.current?.order ?? change.previous?.order}` : ""}</span>
      </div>
      <div className="grid gap-px bg-slate-200 lg:grid-cols-2">
        <QuestionVersionPanel item={change.current} emptyLabel="Không có trong phiên bản này" />
        <QuestionVersionPanel item={change.previous} emptyLabel="Không có trong phiên bản này" muted />
      </div>
    </div>
  )
}

function QuestionVersionPanel({ item, emptyLabel, muted = false }: { item: Exam['questions'][number] | null; emptyLabel: string; muted?: boolean }) {
  if (!item) return <div className="min-h-28 bg-white p-4 text-sm italic text-slate-400">{emptyLabel}</div>
  return (
    <div className={`min-h-28 p-4 ${muted ? 'bg-slate-50' : 'bg-white'}`}>
      <p className="text-xs font-semibold text-slate-500">{item.question.title || `Câu hỏi ${item.order}`}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{item.question.content || item.question.title}</p>
      {item.question.options?.length ? <div className="mt-3 space-y-1.5">{item.question.options.map((option) => <div key={option.id} className={`rounded-md px-2 py-1.5 text-xs ${option.isCorrect ? "bg-emerald-100 font-semibold text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{option.content}{option.isCorrect ? " - Đáp án đúng" : ""}</div>)}</div> : null}
      {item.question.testCases?.length ? (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/60 p-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-violet-900">
            <span>Test cases ({item.question.testCases.length})</span>
            <span className="font-normal text-violet-700">Programming</span>
          </div>
          <div className="mt-2 space-y-2">
            {item.question.testCases.map((testCase, index) => (
              <div key={testCase.id || index} className="rounded-md border border-violet-100 bg-white p-2 text-xs">
                <div className="flex items-center justify-between gap-2 font-semibold text-slate-600">
                  <span>Test case {index + 1}</span>
                  <span className={testCase.isHidden ? "text-slate-500" : "text-emerald-700"}>{testCase.isHidden ? "Hidden" : "Sample"}</span>
                </div>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  <div><p className="font-semibold text-slate-500">Input</p><pre className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-1.5 text-slate-700">{testCase.input || "(empty)"}</pre></div>
                  <div><p className="font-semibold text-slate-500">Expected output</p><pre className="mt-1 whitespace-pre-wrap rounded bg-emerald-50 p-1.5 text-emerald-800">{testCase.expectedOutput || "(empty)"}</pre></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-xs font-semibold text-slate-500">{item.points} điểm</p>
    </div>
  )
}

function questionKey(item: Exam['questions'][number]) {
  if (item.sourceQuestionId) return `source:${item.sourceQuestionId}`
  const title = normalizeQuestionText(item.question.title)
  const content = normalizeQuestionText(item.question.content)
  return `inline:${item.question.type}:${title}:${content}`
}

function normalizeQuestionText(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function buildQuestionChanges(current: Exam, previous: Exam | null): QuestionChange[] {
  if (!previous) return current.questions.map((item) => ({ kind: 'ADDED', current: item, previous: null }))
  const previousBySource = new Map(previous.questions.filter((item) => item.sourceQuestionId).map((item) => [`source:${item.sourceQuestionId}`, item]))
  const previousBySemantic = new Map(previous.questions.map((item) => [semanticQuestionKey(item), item]))
  const matchedPrevious = new Set<string>()
  const changes: QuestionChange[] = current.questions.map((item) => {
    const sourceMatch = item.sourceQuestionId ? previousBySource.get(`source:${item.sourceQuestionId}`) : undefined
    const semanticMatch = previousBySemantic.get(semanticQuestionKey(item))
    const old = sourceMatch && !matchedPrevious.has(oldQuestionIdentity(sourceMatch))
      ? sourceMatch
      : semanticMatch && !matchedPrevious.has(oldQuestionIdentity(semanticMatch))
        ? semanticMatch
        : null
    if (!old) return { kind: "ADDED", current: item, previous: null }
    matchedPrevious.add(oldQuestionIdentity(old))
    return { kind: isQuestionChanged(item, old) ? "MODIFIED" : "UNCHANGED", current: item, previous: old }
  })
  previous.questions.forEach((item) => {
    if (!matchedPrevious.has(oldQuestionIdentity(item))) changes.push({ kind: "REMOVED", current: null, previous: item })
  })
  return changes
}

function semanticQuestionKey(item: Exam["questions"][number]) {
  return `semantic:${item.question.type}:${normalizeQuestionText(item.question.title)}:${normalizeQuestionText(item.question.content)}`
}

function oldQuestionIdentity(item: Exam["questions"][number]) {
  return item.sourceQuestionId ? `source:${item.sourceQuestionId}` : `snapshot:${item.snapshotQuestionId ?? item.questionId}`
}

function isQuestionChanged(current: Exam['questions'][number], previous: Exam['questions'][number]) {
  return current.question.title !== previous.question.title
    || current.question.content !== previous.question.content
    || current.sectionId !== previous.sectionId
    || JSON.stringify(normalizeQuestionOptions(current.question.options)) !== JSON.stringify(normalizeQuestionOptions(previous.question.options))
    || JSON.stringify(normalizeQuestionTestCases(current.question.testCases)) !== JSON.stringify(normalizeQuestionTestCases(previous.question.testCases))
}

function normalizeQuestionOptions(options: Exam['questions'][number]['question']['options']) {
  return (options ?? []).map((option) => ({
    content: option.content,
    isCorrect: option.isCorrect,
  }))
}

function normalizeQuestionTestCases(testCases: Exam['questions'][number]['question']['testCases']) {
  return (testCases ?? []).map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    isHidden: testCase.isHidden,
    isSample: 'isSample' in testCase ? testCase.isSample : undefined,
  }))
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
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
