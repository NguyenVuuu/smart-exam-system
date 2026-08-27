import type { StudentEnrollment } from '../../types/teacher-course.types'

export default function CourseStudentsTab({ students }: { students: StudentEnrollment[] }) {
  return (
    <div className="space-y-5">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Danh Sách Sinh Viên Đã Ghi Danh</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Giảng viên theo dõi danh sách sinh viên thuộc lớp học phần do phòng đào tạo / admin quản lý.
            </p>
          </div>

          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold">
            {students.length} sinh viên
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
            <tr>
              <th className="p-4 sm:px-5 sm:py-4">STT</th>
              <th className="p-4 sm:px-5 sm:py-4">MSSV</th>
              <th className="p-4 sm:px-5 sm:py-4">Họ và Tên</th>
              <th className="p-4 sm:px-5 sm:py-4">Email</th>
              <th className="p-4 sm:px-5 sm:py-4">Ngày ghi danh</th>
              <th className="p-4 sm:px-5 sm:py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((st, idx) => (
              <tr key={st.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 sm:px-5 sm:py-4 text-gray-400">{idx + 1}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-gray-700 font-medium">{st.studentCode}</td>
                <td className="p-4 sm:px-5 sm:py-4 font-semibold text-gray-900">{st.fullName}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-gray-500">{st.email}</td>
                <td className="p-4 sm:px-5 sm:py-4 text-gray-400">{st.enrolledAt}</td>
                <td className="p-4 sm:px-5 sm:py-4">
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    Đang học
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
