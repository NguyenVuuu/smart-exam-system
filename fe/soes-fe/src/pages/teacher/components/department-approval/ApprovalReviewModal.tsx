import { Check, MessageSquarePlus, MessageSquareText, X } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import HtmlContent from '../../../../components/common/HtmlContent'
import type { Exam } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'
import type { ApprovalItem } from '../../types/teacher-approval.types'
import {
  difficultyLabel,
  examCategoryLabel,
  questionTypeLabel,
} from '../../constants/teacher-approval.constants'

interface ApprovalReviewModalProps {
  item: ApprovalItem
  questionNotes: Record<string, string>
  onQuestionNoteChange: (questionId: string, note: string) => void
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export default function ApprovalReviewModal({
  item,
  questionNotes,
  onQuestionNoteChange,
  onClose,
  onApprove,
  onReject,
}: ApprovalReviewModalProps) {
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
          {exam && <ExamReviewContent exam={exam} questionNotes={questionNotes} onQuestionNoteChange={onQuestionNoteChange} />}
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

function ExamReviewContent({
  exam,
  questionNotes,
  onQuestionNoteChange,
}: {
  exam: Exam
  questionNotes: Record<string, string>
  onQuestionNoteChange: (questionId: string, note: string) => void
}) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const orderedQuestions = exam.questions.slice().sort((a, b) => a.order - b.order)

  return (
    <>
      <div className="grid shrink-0 grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <PreviewStat label="Loại bài thi" value={examCategoryLabel[exam.category ?? 'FINAL']} />
        <PreviewStat label="Tổng câu" value={exam.questions.length} />
        <PreviewStat label="Thời lượng" value={`${exam.defaultDurationMinutes} phút`} />
        <PreviewStat label="Tổng điểm" value={`${exam.totalPoints} điểm`} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100">
        <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{exam.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{exam.description}</p>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto pb-4">
          {orderedQuestions.map((item) => {
            const questionId = item.snapshotQuestionId ?? item.questionId
            const note = questionNotes[questionId] ?? ''
            const noteOpen = activeNoteId === questionId || Boolean(note.trim())
            return (
              <div key={`${exam.id}-${questionId}-${item.order}`} className="space-y-2 p-4">
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
                  <button
                    type="button"
                    onClick={() => setActiveNoteId((current) => (current === questionId ? null : questionId))}
                    aria-label={`Ghi chú yêu cầu sửa câu ${item.order}`}
                    title={`Ghi chú yêu cầu sửa câu ${item.order}`}
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      note.trim() ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    {note.trim() ? <MessageSquareText size={16} /> : <MessageSquarePlus size={16} />}
                    <span>Góp ý sửa</span>
                  </button>
                </div>
                <HtmlContent content={item.question.content} className="text-sm font-medium leading-7 text-gray-900" />
                <QuestionAnswerBlock question={item.question} />
                {noteOpen && (
                  <label className="block rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs font-semibold text-amber-800">
                    Nội dung cần sửa ở câu {item.order}
                    <textarea
                      value={note}
                      onChange={(event) => onQuestionNoteChange(questionId, event.target.value)}
                      maxLength={1000}
                      rows={2}
                      placeholder="Ghi rõ nội dung tác giả cần chỉnh sửa"
                      className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-amber-500"
                    />
                  </label>
                )}
              </div>
            )
          })}
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
