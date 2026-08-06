import { Users } from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMembers } from '../../../hooks/course-detail/useMembers'
import MemberCard from './MemberCard'

interface MembersListProps {
  courseOfferingId: string
}

function MembersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MembersList({ courseOfferingId }: MembersListProps) {
  const { items, pagination, isLoading, error, page, setPage } = useMembers(courseOfferingId)

  if (isLoading) return <MembersSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <Users size={36} className="text-gray-200" />
        <p className="text-sm">Chưa có thành viên nào.</p>
      </div>
    )
  }

  const { totalPages } = pagination

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((member) => (
          <MemberCard key={member.memberId} member={member} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                p === page
                  ? 'bg-blue-600 border-blue-600 text-white font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
