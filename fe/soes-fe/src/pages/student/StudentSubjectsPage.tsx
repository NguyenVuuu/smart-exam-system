import { BookOpen } from 'lucide-react'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import SubjectCard from './components/SubjectCard'
import SubjectCardSkeleton from './components/SubjectCardSkeleton'
import SubjectsPagination from './components/SubjectsPagination'
import SubjectsToolbar from './components/SubjectsToolbar'
import { useStudentSubjects } from './hooks/useStudentSubjects'

export default function StudentSubjectsPage() {
  const {
    items,
    pagination,
    semesterOptions,
    currentSemesterId,
    isLoading,
    error,
    keyword,
    setKeyword,
    setPage,
    onSemesterChange,
    retry,
  } = useStudentSubjects()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Page header */}
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} className="text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Môn học của tôi</h1>
          </div>

          {/* Toolbar — always visible once semesterOptions arrive */}
          {!isLoading && !error && (
            <SubjectsToolbar
              keyword={keyword}
              onKeywordChange={setKeyword}
              semesterOptions={semesterOptions}
              selectedSemesterId={currentSemesterId}
              onSemesterChange={onSemesterChange}
            />
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <SubjectCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-56 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={retry}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-56 gap-2 text-gray-400">
              <BookOpen size={36} className="text-gray-200" />
              <p className="text-sm">Không có môn học trong học kỳ này.</p>
            </div>
          )}

          {/* Subject grid */}
          {!isLoading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((subject) => (
                  <SubjectCard key={subject.courseOfferingId} subject={subject} />
                ))}
              </div>
              <SubjectsPagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
