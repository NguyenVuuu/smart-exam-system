import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import CourseDetailBanner from './components/course-detail/CourseDetailBanner'
import CourseDetailNavTabs, { type CourseTab } from './components/course-detail/CourseDetailNavTabs'
import CourseExamsTab from './components/course-detail/CourseExamsTab'
import CourseMaterialsTab from './components/course-detail/CourseMaterialsTab'
import CourseScoresTab from './components/course-detail/CourseScoresTab'
import CourseStudentsTab from './components/course-detail/CourseStudentsTab'
import CourseTimelineTab from './components/course-detail/CourseTimelineTab'
import { useTeacherCourseDetail } from './hooks/useTeacherCourseDetail'
import type { CourseMaterial } from './types/teacher-course.types'
import { useTeacherCourseCollections } from './hooks/useTeacherCourseCollections'

export default function TeacherCourseDetailPage() {
  const { courseOfferingId } = useParams<{ courseOfferingId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CourseTab>('materials')
  const { data, loading, error, retry, createPost, updatePost, pinPost, deletePost, downloadAttachment } = useTeacherCourseDetail(courseOfferingId)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const collections = useTeacherCourseCollections(courseOfferingId)

  useEffect(() => {
    if (!data) return
    setMaterials(data.materials)
  }, [data])

  if (loading) {
    return <CourseDetailState message="Đang tải lớp học phần..." />
  }

  if (!data) {
    return (
      <CourseDetailState message={error ?? 'Không tìm thấy lớp học phần.'} onRetry={() => void retry()} />
    )
  }

  const course = data.course

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Quay lại danh sách lớp học phần</span>
          </button>

          {/* Banner Header */}
          <CourseDetailBanner course={course} />

          {/* Tab Navigation */}
          <CourseDetailNavTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'materials' && (
            <CourseMaterialsTab
              courseOfferingId={course.id}
              materials={materials}
              setMaterials={setMaterials}
            />
          )}

          {activeTab === 'students' && (
            <CourseStudentsTab
              students={collections.students}
              keyword={collections.studentKeyword}
              onKeywordChange={collections.setStudentKeyword}
              pagination={collections.studentPagination}
              onPageChange={collections.setStudentPage}
            />
          )}

          {activeTab === 'timeline' && (
            <CourseTimelineTab
              announcements={data.announcements}
              onCreate={createPost}
              onUpdate={updatePost}
              onPin={pinPost}
              onDelete={deletePost}
              onDownload={downloadAttachment}
            />
          )}

          {activeTab === 'exams' && (
            <CourseExamsTab
              courseOfferingId={course.id}
              exams={collections.exams}
              pagination={collections.examPagination}
              onPageChange={collections.setExamPage}
            />
          )}

          {activeTab === 'scores' && (
            <CourseScoresTab gradebook={collections.gradebook} onPageChange={collections.setScorePage} />
          )}
        </main>
      </div>
    </div>
  )
}

function CourseDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="grid flex-1 place-items-center p-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">{message}</h1>
            {onRetry && <button onClick={onRetry} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Thử lại</button>}
          </div>
        </main>
      </div>
    </div>
  )
}
