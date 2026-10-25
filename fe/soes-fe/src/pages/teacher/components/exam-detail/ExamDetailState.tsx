import TeacherSidebar from '../TeacherSidebar'
import TeacherTopBar from '../TeacherTopBar'

interface ExamDetailStateProps {
  message: string
  onRetry?: () => void
}

export function ExamDetailState({ message, onRetry }: ExamDetailStateProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="grid flex-1 place-items-center p-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">{message}</h1>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Thử lại
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
