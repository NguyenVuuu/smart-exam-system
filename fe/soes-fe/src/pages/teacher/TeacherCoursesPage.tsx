import { BookOpen, ChevronRight, Filter, RotateCcw, Search, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { MOCK_TEACHER_COURSES } from './mock/teacher-course.mock'

export default function TeacherCoursesPage() {
  const navigate = useNavigate()
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL')
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const handleResetFilters = () => {
    setSelectedSemester('ALL')
    setSelectedSubject('ALL')
    setSearchQuery('')
  }

  const filteredCourses = MOCK_TEACHER_COURSES.filter((course) => {
    const matchSemester = selectedSemester === 'ALL' || course.semesterId === selectedSemester
    const matchSubject = selectedSubject === 'ALL' || course.subjectId === selectedSubject
    const matchSearch =
      course.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSemester && matchSubject && matchSearch
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Lớp Học Phần Giảng Dạy"
            description="Các lớp học phần được phân công giảng dạy trong học kỳ"
          />

          {/* Filter Bar with Reset */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Semester Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={15} className="text-gray-400 shrink-0" />
                <span className="text-xs font-bold text-gray-700">Học kỳ:</span>
                <AppSelect
                  value={selectedSemester}
                  onChange={setSelectedSemester}
                  className="w-44"
                  buttonClassName="bg-blue-50/70 border-blue-200 text-blue-900 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Tất cả học kỳ' },
                    { value: 'sem-2026-1', label: 'Học kỳ 1 năm 2026' },
                    { value: 'sem-2025-2', label: 'Học kỳ 2 năm 2025' },
                  ]}
                />
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700">Môn học:</span>
                <AppSelect
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  className="w-52"
                  buttonClassName="bg-gray-50 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Tất cả môn học' },
                    { value: 'sub-01', label: 'Lập trình Java căn bản' },
                    { value: 'sub-02', label: 'Cấu trúc dữ liệu và Giải thuật' },
                    { value: 'sub-03', label: 'Lập trình C++' },
                  ]}
                />
              </div>

              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shrink-0"
                title="Xóa hết từ khóa và đưa bộ lọc về mặc định"
              >
                <RotateCcw size={13} /> Làm mới
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 w-48 sm:w-60 lg:w-72 shrink-0">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm mã lớp (Ví dụ: JAVA_01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none text-gray-800 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/teacher/courses/${course.id}`)}
                className="bg-white border border-gray-100 hover:border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                      {course.subjectCode.substring(0, 3)}
                    </div>
                    <AppBadge tone={course.status === 'ACTIVE' ? 'emerald' : 'gray'}>
                      {course.status === 'ACTIVE' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                    </AppBadge>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      Mã lớp: {course.courseCode}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors mt-0.5">
                      {course.subjectName}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      {course.totalStudents} SV
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} className="text-gray-400" />
                      {course.totalExams} Bài thi
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
