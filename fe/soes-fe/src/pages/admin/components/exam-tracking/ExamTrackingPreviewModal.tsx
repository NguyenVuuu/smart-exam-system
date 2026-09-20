import { useEffect, useState } from 'react'
import { CalendarPlus, CheckCircle2, Code, Eye, EyeOff, Loader2, X } from 'lucide-react'
import HtmlContent from '../../../../components/common/HtmlContent'
import { PROGRAMMING_LANGUAGE_LABELS } from '../../../../constants/programmingLanguages'
import { getTeacherExam } from '../../../teacher/api/teacher-exams.api'
import type { TeacherExamDetailDto } from '../../../teacher/types/teacher-exam-api.types'
import type { AdminExam } from '../../types/admin.types'
import { ExamCategoryBadge, ExamStatusBadge } from '../AdminBadges'
import AdminButton from '../AdminButton'

type FallbackQuestion = {
  id: string
  title?: string
  content: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'PROGRAMMING'
  points: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  language?: 'JAVA' | 'C' | 'CPP' | null
  options?: Array<{ id: string; content: string; isCorrect: boolean }>
  programmingConfig?: {
    timeLimitMs: number
    memoryLimitMb: number
    maxCodeSizeKb: number
  } | null
  testCases?: Array<{
    id: string
    input: string
    expectedOutput: string
    isHidden: boolean
  }>
}

const fallbackQuestions: FallbackQuestion[] = [
  {
    id: 'fb-q1',
    title: 'Trong Java, từ khóa nào dùng để kế thừa một lớp cha?',
    content: 'Trong ngôn ngữ lập trình Java, từ khóa nào sau đây được sử dụng để một lớp kế thừa từ một lớp khác?',
    type: 'SINGLE_CHOICE',
    points: 0.5,
    difficulty: 'EASY',
    options: [
      { id: 'opt1', content: 'implements', isCorrect: false },
      { id: 'opt2', content: 'extends', isCorrect: true },
      { id: 'opt3', content: 'inherits', isCorrect: false },
      { id: 'opt4', content: 'instanceof', isCorrect: false },
    ],
  },
  {
    id: 'fb-q2',
    title: 'Phương thức main trong Java Console',
    content: 'Phương thức nào là điểm bắt đầu thực thi chính của một ứng dụng Java Console chuẩn?',
    type: 'SINGLE_CHOICE',
    points: 0.5,
    difficulty: 'EASY',
    options: [
      { id: 'opt5', content: 'public void start()', isCorrect: false },
      { id: 'opt6', content: 'public static void main(String[] args)', isCorrect: true },
      { id: 'opt7', content: 'public void run()', isCorrect: false },
      { id: 'opt8', content: 'public int init()', isCorrect: false },
    ],
  },
  {
    id: 'fb-q3',
    title: 'Tính tổng các số chẵn trong mảng số nguyên',
    content: 'Viết chương trình đọc vào một số nguyên n (1 <= n <= 10^5) và mảng n số nguyên. In ra tổng của tất cả các số chẵn có trong mảng. Nếu không có số chẵn nào, in ra 0.',
    type: 'PROGRAMMING',
    points: 2.0,
    difficulty: 'MEDIUM',
    language: 'JAVA',
    programmingConfig: {
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      maxCodeSizeKb: 64,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '5\n1 2 3 4 5',
        expectedOutput: '6',
        isHidden: false,
      },
      {
        id: 'tc-2',
        input: '4\n1 3 5 7',
        expectedOutput: '0',
        isHidden: false,
      },
      {
        id: 'tc-3',
        input: '6\n2 4 6 8 10 12',
        expectedOutput: '42',
        isHidden: true,
      },
    ],
  },
]

const canCreateCentralSchedule = (exam: AdminExam) => exam.category === 'FINAL' && exam.status === 'APPROVED'

export default function ExamTrackingPreviewModal({
  exam,
  onClose,
  onCreateSchedule,
}: {
  exam: AdminExam | null
  onClose: () => void
  onCreateSchedule: (exam: AdminExam) => void
}) {
  const [examDetail, setExamDetail] = useState<TeacherExamDetailDto | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (exam?.id) {
      setLoading(true)
      getTeacherExam(exam.id)
        .then((detail) => {
          if (isMounted) setExamDetail(detail)
        })
        .catch(() => {
          if (isMounted) setExamDetail(null)
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    } else {
      setExamDetail(null)
    }

    return () => {
      isMounted = false
    }
  }, [exam?.id])

  if (!exam) return null

  const displayQuestions = examDetail?.questions && examDetail.questions.length > 0
    ? examDetail.questions
    : fallbackQuestions

  const formatLabel =
    exam.structure === 'PROGRAMMING'
      ? 'Lập trình'
      : exam.structure === 'OBJECTIVE'
      ? 'Trắc nghiệm'
      : 'Hỗn hợp'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex h-[92vh] max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-gray-900">{exam.title}</h2>
              <ExamCategoryBadge category={exam.category} />
              <ExamStatusBadge status={exam.status} category={exam.category} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {exam.subjectName} ({exam.subjectCode}) • Học kỳ: {exam.semesterCode} • Giảng viên: {exam.authorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex min-h-0 flex-1 flex-col space-y-5 overflow-hidden p-6">
          {/* Stats Bar */}
          <div className="grid shrink-0 grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <PreviewStat label="Thời lượng làm bài" value={`${exam.durationMinutes} phút`} />
            <PreviewStat label="Tổng điểm mục tiêu" value={`${exam.totalPoints} điểm`} />
            <PreviewStat label="Số lượng câu hỏi" value={`${displayQuestions.length} câu`} />
            <PreviewStat label="Cấu trúc bài thi" value={formatLabel} />
          </div>

          {/* Question List Card */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5 text-sm font-bold text-gray-900">
              <span>Danh sách câu hỏi trong đề</span>
              <div className="flex items-center gap-2">
                {loading && <Loader2 size={15} className="animate-spin text-blue-600" />}
                <span className="text-sm font-semibold text-blue-600">{displayQuestions.length} câu hỏi</span>
              </div>
            </div>

            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto p-2">
              {displayQuestions.map((question, idx) => {
                const isProgramming = question.type === 'PROGRAMMING'
                const difficultyLabel =
                  question.difficulty === 'EASY'
                    ? 'DỄ'
                    : question.difficulty === 'MEDIUM'
                    ? 'TRUNG BÌNH'
                    : 'KHÓ'
                const typeLabel = isProgramming
                  ? 'Lập trình'
                  : question.type === 'SINGLE_CHOICE'
                  ? '1 đáp án'
                  : question.type === 'MULTIPLE_CHOICE'
                  ? 'Nhiều đáp án'
                  : 'Trắc nghiệm'

                return (
                  <div
                    key={question.id || `q-${idx}`}
                    className="space-y-3 rounded-xl p-4 transition-colors hover:bg-gray-50/50 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">Câu {idx + 1}</span>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {typeLabel}
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Mức độ: {difficultyLabel}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {question.points} điểm
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold leading-6 text-gray-950">
                        {question.title || question.content}
                      </h4>
                      {isProgramming && question.content && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase text-gray-400">Mô tả bài toán</p>
                          <HtmlContent
                            content={question.content}
                            className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs font-medium leading-6 text-gray-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Trắc nghiệm Options */}
                    {!isProgramming && question.options && question.options.length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5 pt-1 md:grid-cols-2">
                        {question.options.map((option, optIdx) => (
                          <div
                            key={option.id || `opt-${optIdx}`}
                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
                              option.isCorrect
                                ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-900'
                                : 'border-gray-100 bg-gray-50 text-gray-700'
                            }`}
                          >
                            {option.isCorrect ? (
                              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                            ) : (
                              <div className="h-4 w-4 shrink-0 rounded-full border border-gray-300" />
                            )}
                            <span>{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lập trình Config & Test cases */}
                    {isProgramming && (
                      <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                            <Code size={14} />{' '}
                            {question.language && question.language in PROGRAMMING_LANGUAGE_LABELS
                              ? PROGRAMMING_LANGUAGE_LABELS[question.language as keyof typeof PROGRAMMING_LANGUAGE_LABELS]
                              : question.language || 'Mọi compiler hỗ trợ'}
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <PreviewConfigPill
                              label="Thời gian"
                              value={`${question.programmingConfig?.timeLimitMs ?? 1000}ms`}
                            />
                            <PreviewConfigPill
                              label="Bộ nhớ"
                              value={`${question.programmingConfig?.memoryLimitMb ?? 128}MB`}
                            />
                            <PreviewConfigPill
                              label="Mã nguồn"
                              value={`${question.programmingConfig?.maxCodeSizeKb ?? 64}KB`}
                            />
                          </div>
                        </div>

                        {question.testCases && question.testCases.length > 0 ? (
                          <div className="space-y-2.5 pt-1">
                            {question.testCases.map((testCase, tIdx) => (
                              <div
                                key={testCase.id || `tc-${tIdx}`}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-3.5 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-blue-700">Test case #{tIdx + 1}</span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                                      testCase.isHidden
                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {testCase.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {testCase.isHidden ? 'Test ẩn' : 'Công khai'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 font-mono text-xs md:grid-cols-2">
                                  <PreviewCodeBlock label="Input" value={testCase.input} />
                                  <PreviewCodeBlock label="Output kỳ vọng" value={testCase.expectedOutput} tone="success" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                            Chưa có test case cho câu lập trình này.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-500">Mã đề: {exam.id}</p>
          <div className="flex gap-2">
            <AdminButton tone="secondary" onClick={onClose}>
              Đóng
            </AdminButton>
            {canCreateCentralSchedule(exam) && (
              <AdminButton
                icon={<CalendarPlus size={16} />}
                onClick={() => {
                  onClose()
                  onCreateSchedule(exam)
                }}
              >
                Tạo lịch thi tập trung
              </AdminButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  )
}

function PreviewConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      {label}: <strong className="text-gray-900">{value}</strong>
    </span>
  )
}

function PreviewCodeBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success'
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2.5">
      <span className="block font-sans text-[11px] font-semibold text-gray-400">{label}</span>
      <pre
        className={`mt-1 whitespace-pre-wrap break-words font-mono text-xs ${
          tone === 'success' ? 'font-semibold text-emerald-600' : 'text-gray-800'
        }`}
      >
        {value || '(Trống)'}
      </pre>
    </div>
  )
}
