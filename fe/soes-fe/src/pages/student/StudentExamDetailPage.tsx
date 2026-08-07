import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ExamAction from './components/exam-detail/ExamAction'
import ExamEmpty from './components/exam-detail/ExamEmpty'
import ExamError from './components/exam-detail/ExamError'
import ExamHeader from './components/exam-detail/ExamHeader'
import ExamInformation from './components/exam-detail/ExamInformation'
import ExamLoading from './components/exam-detail/ExamLoading'
import ExamStatusCard from './components/exam-detail/ExamStatusCard'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import { useExamDetail } from './hooks/exam-detail/useExamDetail'

export default function StudentExamDetailPage() {
  const { courseOfferingId, examId } = useParams<{
    courseOfferingId: string
    examId: string
  }>()

  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useExamDetail(
    courseOfferingId ?? '',
    examId ?? '',
  )

  function handleBack() {
    navigate(`/student/course-offerings/${courseOfferingId ?? ''}`, {
      state: { activeTab: 'timeline' },
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại lớp học</span>
          </button>

          {/* Loading */}
          {isLoading && <ExamLoading />}

          {/* Error */}
          {!isLoading && error && (
            <ExamError message={error} onRetry={refetch} />
          )}

          {/* Empty / not found */}
          {!isLoading && !error && !data && (
            <ExamEmpty onBack={handleBack} />
          )}

          {/* Content */}
          {!isLoading && !error && data && (
            <div className="flex flex-col gap-4">
              <ExamHeader data={data} />
              <ExamStatusCard data={data} />
              <ExamInformation data={data} />
              <div className="flex justify-end">
                <ExamAction data={data} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
