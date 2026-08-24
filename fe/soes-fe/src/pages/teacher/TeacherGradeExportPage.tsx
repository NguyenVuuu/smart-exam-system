import {
  Award,
  BarChart2,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'

interface StudentGradeRow {
  id: string
  studentCode: string
  studentName: string
  classCode: string
  quizScore: number
  midtermScore: number
  finalScore: number
  totalScore: number
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F'
}

const MOCK_GRADES: StudentGradeRow[] = [
  {
    id: 'g-1',
    studentCode: 'SV2026001',
    studentName: 'Trần Minh Nam',
    classCode: '2611COMP10101',
    quizScore: 9.0,
    midtermScore: 8.5,
    finalScore: 8.5,
    totalScore: 8.6,
    letterGrade: 'A',
  },
  {
    id: 'g-2',
    studentCode: 'SV2026002',
    studentName: 'Lê Thị Thu Thảo',
    classCode: '2611COMP10101',
    quizScore: 10.0,
    midtermScore: 9.5,
    finalScore: 9.0,
    totalScore: 9.3,
    letterGrade: 'A',
  },
  {
    id: 'g-3',
    studentCode: 'SV2026003',
    studentName: 'Phạm Đức Anh',
    classCode: '2611COMP10101',
    quizScore: 7.0,
    midtermScore: 6.5,
    finalScore: 6.0,
    totalScore: 6.3,
    letterGrade: 'C',
  },
  {
    id: 'g-4',
    studentCode: 'SV2026004',
    studentName: 'Nguyễn Văn Hoàng',
    classCode: '2611COMP10101',
    quizScore: 8.0,
    midtermScore: 7.5,
    finalScore: 8.0,
    totalScore: 7.9,
    letterGrade: 'B',
  },
  {
    id: 'g-5',
    studentCode: 'SV2026005',
    studentName: 'Đặng Mai Phương',
    classCode: '2611COMP10101',
    quizScore: 9.5,
    midtermScore: 9.0,
    finalScore: 8.5,
    totalScore: 8.9,
    letterGrade: 'A',
  },
  {
    id: 'g-6',
    studentCode: 'SV2026006',
    studentName: 'Vũ Quốc Huy',
    classCode: '2611COMP10101',
    quizScore: 6.0,
    midtermScore: 5.5,
    finalScore: 5.0,
    totalScore: 5.3,
    letterGrade: 'D',
  },
  {
    id: 'g-7',
    studentCode: 'SV2026007',
    studentName: 'Bùi Lan Anh',
    classCode: '2611COMP10101',
    quizScore: 8.5,
    midtermScore: 8.0,
    finalScore: 8.5,
    totalScore: 8.3,
    letterGrade: 'B',
  },
]

const COURSE_OPTIONS = [
  { value: 'co-01', label: '2611COMP10101 - Lập trình Java căn bản' },
  { value: 'co-02', label: '2611COMP10202 - Cấu trúc dữ liệu & Giải thuật' },
  { value: 'co-03', label: '2611COMP10301 - Lập trình C++ nâng cao' },
]

const letterGradeTone = {
  A: 'emerald',
  B: 'blue',
  C: 'amber',
  D: 'rose',
  F: 'rose',
} as const

export default function TeacherGradeExportPage() {
  const [selectedCourse, setSelectedCourse] = useState('co-01')
  const [searchQuery, setSearchQuery] = useState('')
  const [grades] = useState<StudentGradeRow[]>(MOCK_GRADES)

  const handleExportExcel = () => {
    alert('Đã xuất thành công file bảng điểm lớp học phần (.xlsx) theo mẫu chuẩn phòng Khảo thí!')
  }

  const filteredGrades = grades.filter(
    (g) =>
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.studentCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculations for Histogram & Stats
  const totalCount = grades.length
  const avgScore = (grades.reduce((sum, g) => sum + g.totalScore, 0) / totalCount).toFixed(1)
  const passCount = grades.filter((g) => g.totalScore >= 5.0).length
  const passRate = Math.round((passCount / totalCount) * 100)
  const excellentCount = grades.filter((g) => g.totalScore >= 8.5).length
  const goodCount = grades.filter((g) => g.totalScore >= 7.0 && g.totalScore < 8.5).length
  const averageCount = grades.filter((g) => g.totalScore >= 5.0 && g.totalScore < 7.0).length
  const weakCount = grades.filter((g) => g.totalScore < 5.0).length

  // Columns definition
  const columns: ColumnDef<StudentGradeRow>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'MSSV',
      width: '120px',
      render: (g) => <span className="text-blue-600">{g.studentCode}</span>,
    },
    {
      header: 'Họ và Tên Sinh Viên',
      render: (g) => <span className="font-semibold text-gray-900">{g.studentName}</span>,
    },
    {
      header: 'Quiz / Thường kỳ',
      width: '130px',
      align: 'center',
      render: (g) => <span className="text-gray-700">{g.quizScore.toFixed(1)}</span>,
    },
    {
      header: 'Giữa Kỳ (40%)',
      width: '130px',
      align: 'center',
      render: (g) => <span className="text-gray-700">{g.midtermScore.toFixed(1)}</span>,
    },
    {
      header: 'Cuối Kỳ (60%)',
      width: '130px',
      align: 'center',
      render: (g) => <span className="text-gray-700">{g.finalScore.toFixed(1)}</span>,
    },
    {
      header: 'Điểm Tổng Kết',
      width: '140px',
      align: 'center',
      render: (g) => (
        <span className="font-semibold text-xs text-gray-900">
          {g.totalScore.toFixed(1)}
        </span>
      ),
    },
    {
      header: 'Điểm Chữ',
      width: '100px',
      align: 'center',
      render: (g) => (
        <AppBadge tone={letterGradeTone[g.letterGrade]} shape="rounded" className="text-xs">
          {g.letterGrade}
        </AppBadge>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Khảo Thí, Phổ Điểm & Báo Cáo Kết Quả"
            description="Thống kê phổ điểm, phân tích kết quả học tập và xuất bảng điểm lớp học phần"
            actions={
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet size={16} /> Xuất Bảng Điểm Excel (.xlsx)
              </button>
            }
          />

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">Tổng Số Sinh Viên</span>
                <span className="text-2xl font-bold text-gray-900 block">{totalCount} sinh viên</span>
                <span className="text-xs text-emerald-600 font-medium">100% đã hoàn thành bài thi</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">Điểm Trung Bình Lớp</span>
                <span className="text-2xl font-bold text-blue-600 block">{avgScore} / 10.0</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <TrendingUp size={12} /> Tăng +0.4 so với kỳ trước
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">Tỷ Lệ Đạt (Pass)</span>
                <span className="text-2xl font-bold text-emerald-600 block">{passRate}%</span>
                <span className="text-xs text-gray-400">{passCount}/{totalCount} SV đạt trên 5.0đ</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">Xếp Loại Giỏi / Xuất Sắc</span>
                <span className="text-2xl font-bold text-amber-600 block">{excellentCount} SV</span>
                <span className="text-xs text-gray-400">Đạt điểm A/A+ (&ge; 8.5)</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={20} />
              </div>
            </div>
          </div>

          {/* Phổ Điểm Histogram & Phân Bố */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Phân Phối Phổ Điểm Lớp Học Phần</h3>
                <p className="text-xs text-gray-500">Biểu đồ tỷ lệ phân loại học lực của sinh viên theo chuẩn điểm thang 10</p>
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                Thang đo 4 mức
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Giỏi / Xuất sắc [8.5 - 10]</span>
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-800">{excellentCount} SV</span>
                </div>
                <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(excellentCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-700 font-medium">
                  {Math.round((excellentCount / totalCount) * 100)}% tổng số sinh viên
                </span>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Khá [7.0 - 8.4]</span>
                  <span className="bg-blue-200/80 px-2 py-0.5 rounded text-blue-800">{goodCount} SV</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(goodCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-blue-700 font-medium">
                  {Math.round((goodCount / totalCount) * 100)}% tổng số sinh viên
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Trung bình [5.0 - 6.9]</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded text-amber-800">{averageCount} SV</span>
                </div>
                <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(averageCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-amber-700 font-medium">
                  {Math.round((averageCount / totalCount) * 100)}% tổng số sinh viên
                </span>
              </div>

              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Yếu / Kém [&lt; 5.0]</span>
                  <span className="bg-rose-200/80 px-2 py-0.5 rounded text-rose-800">{weakCount} SV</span>
                </div>
                <div className="w-full bg-rose-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(weakCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-rose-700 font-medium">
                  {Math.round((weakCount / totalCount) * 100)}% tổng số sinh viên
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar & Data Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="w-full sm:w-80">
                <AppSelect
                  value={selectedCourse}
                  onChange={(val) => setSelectedCourse(val)}
                  options={COURSE_OPTIONS}
                />
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo MSSV hoặc Họ tên sinh viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredGrades}
              keyExtractor={(g) => g.id}
              emptyText="Không tìm thấy bản ghi điểm nào phù hợp."
            />
          </div>
        </main>
      </div>
    </div>
  )
}
