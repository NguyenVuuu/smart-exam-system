import { CalendarPlus, X } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { AdminExam } from '../../types/admin.types'
import { ExamCategoryBadge, ExamStatusBadge } from '../AdminBadges'
import AdminButton from '../AdminButton'

type PreviewQuestionOption = {
  label: string
  content: string
  correct?: boolean
}

type PreviewQuestion = {
  id: string
  kind: 'Trắc nghiệm' | 'Lập trình'
  points: number
  content: string
  options?: PreviewQuestionOption[]
  codeNote?: string
}

const previewQuestionsByExam: Record<string, PreviewQuestion[]> = {
  'exam-01': [
    {
      id: 'q1',
      kind: 'Trắc nghiệm',
      points: 0.5,
      content: 'Trong Java, từ khóa nào dùng để kế thừa một lớp cha?',
      options: [
        { label: 'A', content: 'implements' },
        { label: 'B', content: 'extends', correct: true },
        { label: 'C', content: 'inherits' },
        { label: 'D', content: 'instanceof' },
      ],
    },
    {
      id: 'q2',
      kind: 'Trắc nghiệm',
      points: 0.5,
      content: 'Phương thức nào là điểm bắt đầu thực thi của một ứng dụng Java Console?',
      options: [
        { label: 'A', content: 'public void start()' },
        { label: 'B', content: 'public static void main(String[] args)', correct: true },
        { label: 'C', content: 'public void run()' },
        { label: 'D', content: 'public int init()' },
      ],
    },
    {
      id: 'q3',
      kind: 'Lập trình',
      points: 2.0,
      content: 'Viết chương trình đọc một mảng n số nguyên và in ra tổng các số chẵn trong mảng.',
      codeNote: 'Ngôn ngữ: Java • Time limit: 1000ms • Memory: 256MB • 3 test case mẫu',
    },
  ],
}

const canCreateCentralSchedule = (exam: AdminExam) => exam.category === 'FINAL' && exam.status === 'APPROVED'

const getOperationNote = (exam: AdminExam) => {
  if (exam.category !== 'FINAL') return 'Giảng viên tự tổ chức trong lớp phụ trách'
  if (exam.status === 'APPROVED') return 'Sẵn sàng để Admin tạo lịch thi tập trung'
  if (exam.status === 'PENDING_APPROVAL') return 'Chờ Trưởng bộ môn duyệt chuyên môn'
  if (exam.status === 'REJECTED') return 'Đã bị từ chối, chờ giảng viên chỉnh sửa'
  if (exam.status === 'LOCKED') return 'Đã khóa do đã có ca thi hoặc bài làm'
  return 'Chưa đủ điều kiện tổ chức thi cuối kỳ'
}

export default function ExamTrackingPreviewModal({
  exam,
  onClose,
  onCreateSchedule,
}: {
  exam: AdminExam | null
  onClose: () => void
  onCreateSchedule: (exam: AdminExam) => void
}) {
  if (!exam) return null

  const questions = previewQuestionsByExam[exam.id] ?? previewQuestionsByExam['exam-01']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-950">{exam.title}</h2>
              <ExamCategoryBadge category={exam.category} />
              <ExamStatusBadge status={exam.status} />
            </div>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              {exam.subjectName} ({exam.subjectCode}) • Học kỳ: {exam.semesterCode} • Giảng viên: {exam.authorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Thời lượng</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{exam.durationMinutes} phút</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Tổng điểm</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{exam.totalPoints} điểm</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Số câu hỏi</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{exam.questionCount} câu</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Cấu trúc</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {exam.structure === 'OBJECTIVE' ? 'Trắc nghiệm' : exam.structure === 'PROGRAMMING' ? 'Lập trình' : 'Hỗn hợp'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-800">
            <span className="font-semibold">Lưu ý nghiệp vụ:</span> {getOperationNote(exam)}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Danh sách câu hỏi trong đề</h3>
              <span className="text-xs text-slate-400">Hiển thị {questions.length} câu mẫu</span>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">Câu {index + 1}</span>
                      <AppBadge tone={question.kind === 'Trắc nghiệm' ? 'blue' : 'emerald'}>{question.kind}</AppBadge>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{question.points} điểm</span>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{question.content}</p>

                  {question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {question.options.map((option) => (
                        <div
                          key={option.label}
                          className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
                            option.correct
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 font-medium'
                              : 'border-gray-100 bg-gray-50/50 text-slate-700'
                          }`}
                        >
                          <span className="font-bold">{option.label}.</span>
                          <span>{option.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.codeNote && (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                      {question.codeNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-xs text-slate-500">Mã đề: {exam.id}</p>
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
