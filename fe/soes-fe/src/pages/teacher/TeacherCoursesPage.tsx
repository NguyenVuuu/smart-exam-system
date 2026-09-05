import { BookOpen, ChevronRight, RotateCcw, Search, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherCourses } from './hooks/useTeacherCourses'

export default function TeacherCoursesPage() {
  const navigate = useNavigate()
  const { courses, semesterOptions, currentSemesterId, loading, error, retry } = useTeacherCourses()
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const effectiveSemester = selectedSemester ?? currentSemesterId ?? 'ALL'

  const handleResetFilters = () => {
    setSelectedSemester(null)
    setSelectedSubject('ALL')
    setSearchQuery('')
  }

  const filteredCourses = courses.filter((course) => {
    const matchSemester = effectiveSemester === 'ALL' || course.semesterId === effectiveSemester
    const matchSubject = selectedSubject === 'ALL' || course.subjectId === selectedSubject
    const matchSearch =
      course.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSemester && matchSubject && matchSearch
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Lớp Học Phần Giảng Dạy"
            description="Các lớp học phần được phân công giảng dạy trong học kỳ"
            icon={<BookOpen size={21} />}
          />

          {/* Filter Bar with Reset */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3 overflow-visible">
            <div className="flex items-center gap-3 shrink-0">
              {/* Semester Filter */}
              <AppSelect
                value={effectiveSemester}
                onChange={setSelectedSemester}
                className="w-72"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl whitespace-nowrap"
                menuClassName="whitespace-nowrap"
                options={[{ value: 'ALL', label: 'Tất cả học kỳ' }, ...semesterOptions]}
              />

              {/* Subject Filter */}
              <AppSelect
                value={selectedSubject}
                onChange={setSelectedSubject}
                className="w-52"
                buttonClassName="bg-gray-50 border-gray-200 py-2 text-sm text-gray-700 font-medium rounded-xl"
                options={[{ value: 'ALL', label: 'Môn học' }, ...uniqueOptions(courses, 'subjectId', 'subjectName')]}
              />

              <button
                onClick={handleResetFilters}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-800 rounded-xl transition-colors flex items-center justify-center shrink-0"
                title="Làm mới bộ lọc"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 w-64 sm:w-80 shrink-0">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm mã lớp (Ví dụ: JAVA_01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none text-gray-800 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          {loading && <p className="py-12 text-center text-sm text-slate-500">Đang tải lớp học phần...</p>}
          {error && (
            <div className="py-12 text-center text-sm text-rose-600">
              <p>{error}</p><button type="button" className="mt-2 text-blue-600 underline" onClick={retry}>Thử lại</button>
            </div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),360px))] items-start gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/teacher/courses/${course.id}`)}
                className="group flex min-h-[190px] cursor-pointer flex-col gap-4 rounded-xl border border-gray-100 bg-white p-[18px] shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[13px] font-bold text-blue-600">
                      {course.subjectCode.substring(0, 3)}
                    </div>
                    <AppBadge tone={course.status === 'ACTIVE' ? 'emerald' : 'gray'}>
                      {course.status === 'ACTIVE' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                    </AppBadge>
                  </div>

                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold uppercase text-blue-600" title={`Mã lớp: ${course.courseCode}`}>
                      Mã lớp: {course.courseCode}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-5 text-gray-900 transition-colors group-hover:text-blue-600">
                      {course.subjectName}
                    </h3>
                    {course.description && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-500">{course.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-[13px] text-gray-500">
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

function uniqueOptions(
  courses: Array<{ semesterId: string; semesterName: string; subjectId: string; subjectName: string }>,
  valueKey: 'semesterId' | 'subjectId',
  labelKey: 'semesterName' | 'subjectName',
) {
  return [...new Map(courses.map((course) => [course[valueKey], course[labelKey]])).entries()]
    .map(([value, label]) => ({ value, label }))
}
