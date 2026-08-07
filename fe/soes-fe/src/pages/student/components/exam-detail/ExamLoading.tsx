export default function ExamLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        </div>
      </div>

      {/* Info skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Status skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  )
}
