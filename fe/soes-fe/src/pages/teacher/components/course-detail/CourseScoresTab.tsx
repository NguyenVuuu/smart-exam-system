import { FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import { MOCK_STUDENT_SCORES } from '../../mock/teacher-course.mock'

export default function CourseScoresTab() {
  const [isScoresPublished, setIsScoresPublished] = useState(true)

  return (
    <div className="space-y-5">
      {/* Score Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm">
            <input
              type="checkbox"
              checked={isScoresPublished}
              onChange={(e) => setIsScoresPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-600 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold text-emerald-800">
              Công bố điểm các bài thi trong lớp
            </span>
          </label>
        </div>

        <button
          onClick={() => alert('Đã xuất Bảng điểm Lớp Học Phần ra tệp Excel thành công!')}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet size={18} /> Export Bảng Điểm Excel
        </button>
      </div>

      {/* Scores Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
            <tr>
              <th className="p-4 sm:px-5 sm:py-4">MSSV</th>
              <th className="p-4 sm:px-5 sm:py-4">Họ và Tên</th>
              <th className="p-4 sm:px-5 sm:py-4">Điểm Giữa Kỳ (40%)</th>
              <th className="p-4 sm:px-5 sm:py-4">Điểm Cuối Kỳ (60%)</th>
              <th className="p-4 sm:px-5 sm:py-4">Điểm Tổng Kết</th>
              <th className="p-4 sm:px-5 sm:py-4 text-right">Trạng thái công bố</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_STUDENT_SCORES.map((sc, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 sm:px-5 sm:py-4 text-gray-700 font-medium">{sc.studentCode}</td>
                <td className="p-4 sm:px-5 sm:py-4 font-semibold text-gray-900">{sc.fullName}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-gray-700">{sc.midtermScore ?? '-'}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-gray-700">{sc.finalScore ?? '-'}</td>
                <td className="p-4 sm:px-5 sm:py-4 font-semibold text-gray-900">{sc.averageScore ?? '-'}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-right">
                  <AppBadge tone={isScoresPublished ? 'emerald' : 'gray'}>
                    {isScoresPublished ? 'Đã công bố' : 'Ẩn với sinh viên'}
                  </AppBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
