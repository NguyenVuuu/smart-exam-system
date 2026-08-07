import { ArrowLeft, FileX } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PostDetail, { PostDetailSkeleton } from './components/course-detail/post-detail/PostDetail'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import { usePostDetail } from './hooks/course-detail/usePostDetail'

export default function StudentPostDetailPage() {
  const { courseOfferingId, postId } = useParams<{
    courseOfferingId: string
    postId: string
  }>()

  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = usePostDetail(
    courseOfferingId ?? '',
    postId ?? '',
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

          {/* Loading skeleton */}
          {isLoading && <PostDetailSkeleton />}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <FileX size={36} className="text-gray-200" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={refetch}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty / not found state */}
          {!isLoading && !error && !data && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <FileX size={36} className="text-gray-200" />
              <p className="text-sm">Không tìm thấy bài đăng.</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Quay lại
              </button>
            </div>
          )}

          {/* Post detail */}
          {!isLoading && !error && data && <PostDetail data={data} />}
        </main>
      </div>
    </div>
  )
}
