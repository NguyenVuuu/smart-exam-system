import { Check, Code, XCircle } from 'lucide-react'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'

interface SubmissionAnswerListProps {
  exam: Exam
  submission: ExamSubmission
}

export default function SubmissionAnswerList({ exam, submission }: SubmissionAnswerListProps) {
  return (
    <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
      {exam.questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, index) => {
          const questionIds = [item.snapshotQuestionId, item.questionId].filter(Boolean)
          const answer = submission.answers?.find((candidate) => questionIds.includes(candidate.questionId))
          const selectedOptionIds = answer?.selectedOptionIds ?? []
          const codingResults = submission.codingResults?.filter((result) => questionIds.includes(result.questionId)) ?? []
          const passedTests = codingResults.filter((result) => result.passed).length

          return (
            <div key={`${submission.id}-${item.questionId}-${index}`} className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-blue-600">Câu {index + 1}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                  {item.question.type === 'PROGRAMMING' ? 'Lập trình' : 'Trắc nghiệm'}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                  {item.points} điểm
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold leading-6 text-gray-950">
                  {item.question.title}
                </h4>
                {item.question.type === 'PROGRAMMING' && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase text-gray-400">Mô tả bài toán</p>
                    <p className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs font-medium leading-6 text-gray-800">
                      {item.question.content}
                    </p>
                  </div>
                )}
              </div>

              {item.question.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.question.options.map((option) => {
                    const isSelected = selectedOptionIds.includes(option.id)
                    return (
                      <div
                        key={option.id}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs flex items-center gap-2 ${
                          option.isCorrect
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : isSelected
                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                              : 'bg-gray-50 border-gray-100 text-gray-600'
                        }`}
                      >
                        {isSelected && <Check size={13} className="shrink-0" />}
                        <span>{option.content}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {item.question.type === 'PROGRAMMING' && (
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-2">
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-gray-100">
                    {answer?.sourceCode || 'Sinh viên không nộp mã nguồn.'}
                  </pre>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Code size={13} className="text-blue-600" /> Kết quả chạy test
                  </p>
                  <p className="text-gray-600">
                    {codingResults.length
                      ? `${passedTests}/${codingResults.length} test case đạt`
                      : 'Chưa có dữ liệu test case.'}
                  </p>
                  {codingResults.length > 0 && (
                    <div className="space-y-2">
                      {codingResults.map((result, resultIndex) => (
                        <div key={`${result.testCaseId}-${resultIndex}`} className="rounded-lg border border-gray-100 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800">
                              Test case #{resultIndex + 1}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              result.passed
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {result.passed ? <Check size={12} /> : <XCircle size={12} />}
                              {result.passed ? 'Đạt' : 'Sai'}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-xs md:grid-cols-3">
                            <CodeResultBlock label="Input" value={result.input} />
                            <CodeResultBlock label="Kỳ vọng" value={result.expectedOutput} tone="success" />
                            <CodeResultBlock label="Kết quả" value={result.actualOutput || '-'} tone={result.passed ? 'success' : 'danger'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}

function CodeResultBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success' | 'danger'
}) {
  const toneClassName = tone === 'success'
    ? 'text-emerald-700'
    : tone === 'danger'
      ? 'text-rose-700'
      : 'text-gray-800'

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
      <span className="block font-sans text-[11px] font-semibold text-gray-400">{label}</span>
      <pre className={`mt-1 whitespace-pre-wrap break-words ${toneClassName}`}>{value}</pre>
    </div>
  )
}
