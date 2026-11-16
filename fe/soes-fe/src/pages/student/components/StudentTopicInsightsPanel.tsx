import { ArrowRight, Lightbulb, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppSelect from '../../../components/common/AppSelect'
import type { StudentLearningInsights } from '../api/student-learning.api'

interface StudentTopicInsightsPanelProps {
  visible: boolean
  insights: StudentLearningInsights | null
  loading: boolean
  error: boolean
  onPracticeTopic: (topicId: string) => void
}

function getTopicRecommendation(topic: StudentLearningInsights['topics'][number]) {
  if (!topic.sufficientData) return {
    label: 'Cần thêm dữ liệu',
    badgeClassName: 'bg-amber-50 text-amber-700',
    content: `Nội dung nên luyện: ${topic.name}. Hãy làm thêm câu hỏi để hệ thống đánh giá chính xác hơn mức độ hiểu bài.`,
  }
  if (topic.percentage <= 40) return {
    label: 'Ưu tiên cao',
    badgeClassName: 'bg-red-50 text-red-700',
    content: `Nội dung nên ôn: ${topic.name}. Bắt đầu bằng định nghĩa và quy tắc cốt lõi, xem ví dụ mẫu rồi làm bài từ dễ đến trung bình.`,
  }
  if (topic.needsPractice) return {
    label: 'Cần củng cố',
    badgeClassName: 'bg-amber-50 text-amber-700',
    content: `Nội dung nên củng cố: ${topic.name}. Làm câu hỏi vận dụng và xem kỹ lời giải của những câu trả lời sai.`,
  }
  return {
    label: 'Duy trì',
    badgeClassName: 'bg-emerald-50 text-emerald-700',
    content: `Nội dung nên duy trì: ${topic.name}. Tiếp tục làm câu hỏi vận dụng để giữ mức độ thành thạo.`,
  }
}

export default function StudentTopicInsightsPanel({
  visible,
  insights,
  loading,
  error,
  onPracticeTopic,
}: StudentTopicInsightsPanelProps) {
  const [subjectId, setSubjectId] = useState('')
  const subjects = useMemo(() => Array.from(new Map(
    (insights?.topics ?? []).map((topic) => [topic.subjectId, {
      value: topic.subjectId,
      label: topic.subjectName,
    }]),
  ).values()), [insights])

  const selectedSubjectId = subjects.some((subject) => subject.value === subjectId)
    ? subjectId
    : subjects[0]?.value ?? ''
  const topics = (insights?.topics ?? []).filter((topic) => topic.subjectId === selectedSubjectId)

  return (
    <section
      id="learning-panel-topics"
      role="tabpanel"
      aria-labelledby="learning-tab-topics"
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${visible ? '' : 'hidden'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Target size={20} /></span>
          <div>
            <h2 className="font-semibold text-slate-950">Chủ đề cần chú ý</h2>
            {insights && (
              <p className="mt-1 text-sm text-slate-500">
                Dựa trên {insights.analyzedAttemptCount} lượt thi đủ điều kiện xem lại.
                {insights.limitedToRecentAttempts && ' Chỉ tính các lượt gần đây.'}
              </p>
            )}
          </div>
        </div>
        {subjects.length > 0 && (
          <div className="w-full sm:w-72">
            <p className="mb-1.5 text-sm font-semibold text-slate-700">
              Môn học
            </p>
            <AppSelect
              value={selectedSubjectId}
              options={subjects}
              onChange={setSubjectId}
              ariaLabel="Chọn môn học để xem chủ đề cần chú ý"
              buttonClassName="h-11 border-slate-200"
            />
          </div>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">Đang tải dữ liệu...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">Không thể tải dữ liệu kết quả học tập.</p>}
      {!loading && insights && insights.topics.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          Chưa đủ dữ liệu từ kết quả được phép xem lại để xác định chủ đề yếu. Bạn vẫn có thể chọn tài liệu lớp học để hỏi và ôn tập.
        </p>
      )}
      {!loading && topics.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => {
            const recommendation = getTopicRecommendation(topic)
            return <div key={topic.topicId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{topic.name}</p>
                <span className="text-sm font-bold text-blue-700">{topic.percentage}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {topic.questionCount} lượt trả lời · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Lightbulb size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800">Gợi ý nội dung</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${recommendation.badgeClassName}`}>
                    {recommendation.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.content}</p>
              </div>
              <button type="button" onClick={() => onPracticeTopic(topic.topicId)}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Ôn chủ đề này <ArrowRight size={16} />
              </button>
            </div>
          })}
        </div>
      )}
    </section>
  )
}
