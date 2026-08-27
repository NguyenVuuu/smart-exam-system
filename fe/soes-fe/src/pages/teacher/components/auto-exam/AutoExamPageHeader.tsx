import { WandSparkles } from 'lucide-react'
import TeacherPageHeader from '../TeacherPageHeader'

export default function AutoExamPageHeader({ onBackToExams }: { onBackToExams: () => void }) {
  return (
    <TeacherPageHeader
      title="Sinh Đề Thi Tự Động"
      description="Sinh đề trắc nghiệm từ ngân hàng câu hỏi: 1 đáp án, nhiều đáp án và đúng/sai"
      icon={<WandSparkles size={22} />}
      actions={
        <button
          onClick={onBackToExams}
          className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
        >
          Danh sách đề thi →
        </button>
      }
    />
  )
}
