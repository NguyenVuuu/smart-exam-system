import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTimeline } from '../../../hooks/course-detail/useTimeline'
import type { TimelineItem } from '../../../types/course-detail.types'
import ExamTimelineItem from './ExamTimelineItem'
import PostTimelineItem from './PostTimelineItem'
import TimelinePagination from './TimelinePagination.tsx'

interface TimelineProps {
  courseOfferingId: string
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Timeline({ courseOfferingId }: TimelineProps) {
  const navigate = useNavigate()
  const { items, pagination, isLoading, error, page, setPage } = useTimeline(courseOfferingId)

  function handleItemClick(item: TimelineItem) {
    if (item.type === 'POST') {
      navigate(`/student/course-offerings/${courseOfferingId}/posts/${item.id}`)
    } else {
      navigate(`/student/course-offerings/${courseOfferingId}/exam-schedules/${item.id}`)
    }
  }

  if (isLoading) return <TimelineSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <MessageSquare size={36} className="text-gray-200" />
        <p className="text-sm">Chưa có bài đăng hoặc bài thi nào.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          if (item.type === 'POST') {
            return (
              <PostTimelineItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            )
          }
          return (
            <ExamTimelineItem
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          )
        })}
      </div>

      <TimelinePagination pagination={pagination} onPageChange={setPage} currentPage={page} />
    </div>
  )
}
