import { Calendar } from 'lucide-react'
import type { UpcomingExam } from '../types/dashboard.types'

interface UpcomingExamListProps {
  exams: UpcomingExam[]
}

export default function UpcomingExamList({ exams }: UpcomingExamListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <Calendar size={15} className="text-gray-400" />
        Bài thi sắp diễn ra
      </h3>

      <ul className="space-y-2.5">
        {exams.map((exam) => (
          <li key={exam.id} className="flex items-center gap-2.5 text-sm text-gray-700">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                exam.status === 'soon' ? 'bg-green-500' : 'bg-green-400'
              }`}
            />
            <span>
              {exam.title}{' '}
              <span className="text-gray-400">
                ({exam.date} - {exam.time})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
