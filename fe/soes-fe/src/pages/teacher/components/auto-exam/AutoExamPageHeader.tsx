import TeacherPageHeader from '../TeacherPageHeader'

export default function AutoExamPageHeader({ onBackToExams }: { onBackToExams: () => void }) {
  return (
    <TeacherPageHeader
      title="Sinh Đề Thi Tự Động"
      description="Sinh đề trắc nghiệm từ ngân hàng câu hỏi: 1 đáp án, nhiều đáp án và đúng/sai"
      actions={
        <button
          onClick={onBackToExams}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors"
        >
          Danh sách đề thi →
        </button>
      }
    />
  )
}
