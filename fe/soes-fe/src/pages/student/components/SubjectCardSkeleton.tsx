export default function SubjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded mt-1" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-8 bg-gray-200 rounded-lg" />
    </div>
  )
}
