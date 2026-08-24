import { ArrowLeft, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CourseHeader from './components/course-detail/CourseHeader'
import CourseTabs, { type CourseTab } from './components/course-detail/CourseTabs'
import MembersList from './components/course-detail/members/MembersList'
import ScoreTable from './components/course-detail/scores/ScoreTable'
import Timeline from './components/course-detail/timeline/Timeline'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import { useCourseHeader } from './hooks/course-detail/useCourseHeader'

interface LocationState {
  activeTab?: CourseTab
}

export default function StudentCourseDetailPage() {
  const { courseOfferingId } = useParams<{ courseOfferingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const [activeTab, setActiveTab] = useState<CourseTab>(
    locationState?.activeTab ?? 'timeline',
  )

  const { data, isLoading, error } = useCourseHeader(courseOfferingId ?? '')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/student/subjects')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại môn học</span>
          </button>

          {/* Course Header loading skeleton */}
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-16" />
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          )}

          {/* Course Header error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <BookOpen size={36} className="text-gray-200" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => navigate('/student/subjects')}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Quay lại
              </button>
            </div>
          )}

          {/* Course Header loaded */}
          {!isLoading && !error && data && (
            <>
              <CourseHeader data={data} />

              <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Tab content */}
              {activeTab === 'timeline' && (
                <Timeline courseOfferingId={courseOfferingId ?? ''} />
              )}
              {activeTab === 'members' && (
                <MembersList courseOfferingId={courseOfferingId ?? ''} />
              )}
              {activeTab === 'scores' && (
                <ScoreTable courseOfferingId={courseOfferingId ?? ''} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
