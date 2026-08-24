import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import {
  MOCK_COURSE_MATERIALS,
  MOCK_ENROLLED_STUDENTS,
  MOCK_STUDENT_SCORES,
  MOCK_TEACHER_COURSES,
} from './mock/teacher-course.mock'
import type { CourseMaterial, StudentEnrollment } from './types/teacher-course.types'

type CourseTab = 'materials' | 'students' | 'timeline' | 'exams' | 'scores'

interface CourseAnnouncement {
  id: string
  title: string
  content: string
  attachedFileName?: string
  createdAt: string
  teacherName: string
}

let teacherCourseDraftIdSequence = 0

export default function TeacherCourseDetailPage() {
  const { courseOfferingId } = useParams<{ courseOfferingId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CourseTab>('materials')

  // Find course or fallback to first mock
  const course =
    MOCK_TEACHER_COURSES.find((c) => c.id === courseOfferingId) || MOCK_TEACHER_COURSES[0]

  // State for Materials
  const [materials, setMaterials] = useState<CourseMaterial[]>(MOCK_COURSE_MATERIALS)
  const [fileNameInput, setFileNameInput] = useState('')
  const [fileTypeError, setFileTypeError] = useState<string | null>(null)

  // State for Students
  const studentList: StudentEnrollment[] = MOCK_ENROLLED_STUDENTS

  // State for Announcements (Bảng tin)
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([
    {
      id: 'ann-1',
      title: 'Thông báo lịch kiểm tra giữa kỳ môn Lập trình Java',
      content:
        'Các bạn sinh viên lưu ý kỳ thi giữa kỳ sẽ tổ chức vào 8:00 sáng ngày 20/08/2026. Bài thi bao gồm cả câu hỏi Trắc nghiệm và 1 bài thực hành Console.',
      attachedFileName: 'Huong_Dan_On_Tap_Giua_Ky.pdf',
      createdAt: '18/08/2026 09:30',
      teacherName: 'TS. Nguyễn Văn Giảng',
    },
  ])
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false)
  const [annTitleInput, setAnnTitleInput] = useState('')
  const [annContentInput, setAnnContentInput] = useState('')
  const [annFileInput, setAnnFileInput] = useState('')

  // State for Scores
  const [isScoresPublished, setIsScoresPublished] = useState(true)

  // Handler for uploading file & checking duplicate name
  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileNameInput.trim()) return

    const isDuplicate = materials.some(
      (m) => m.fileName.toLowerCase() === fileNameInput.trim().toLowerCase(),
    )

    if (isDuplicate) {
      setFileTypeError(`Tệp "${fileNameInput}" đã tồn tại trong lớp HP này! Vui lòng đổi tên tệp.`)
      return
    }

    setFileTypeError(null)
    const newMat: CourseMaterial = {
      id: `mat-draft-${++teacherCourseDraftIdSequence}`,
      courseOfferingId: course.id,
      fileName: fileNameInput.trim(),
      fileType: 'PDF',
      fileSize: '3.5 MB',
      uploadedAt: 'Vừa xong',
      selectedForAI: false,
      downloadUrl: '#',
    }

    setMaterials([newMat, ...materials])
    setFileNameInput('')
  }

  // Toggle Checkbox AI selection
  const toggleSelectForAI = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selectedForAI: !m.selectedForAI } : m)),
    )
  }

  // Handler for posting announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitleInput.trim() || !annContentInput.trim()) return

    const newAnn: CourseAnnouncement = {
      id: `ann-draft-${++teacherCourseDraftIdSequence}`,
      title: annTitleInput.trim(),
      content: annContentInput.trim(),
      attachedFileName: annFileInput.trim() || undefined,
      createdAt: 'Vừa xong',
      teacherName: course.teacherName,
    }

    setAnnouncements([newAnn, ...announcements])
    setAnnTitleInput('')
    setAnnContentInput('')
    setAnnFileInput('')
    setIsAnnModalOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Quay lại danh sách lớp học phần</span>
          </button>

          {/* Banner Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-200">
                {course.subjectCode.substring(0, 3)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-md">
                    {course.courseCode}
                  </span>
                  <span className="text-xs text-gray-400">• {course.semesterName}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
                  {course.subjectName}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Giảng viên phụ trách: {course.teacherName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/teacher/question-bank')}
                className="px-4.5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
              >
                <Sparkles size={16} className="text-amber-500" />
                AI Sinh câu hỏi từ Lớp HP
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200/80">
            {[
              { id: 'materials', label: 'Tài liệu học tập & AI', icon: <FileText size={16} /> },
              { id: 'students', label: 'Danh sách sinh viên', icon: <Users size={16} /> },
              { id: 'timeline', label: 'Bảng tin lớp học', icon: <BookOpen size={16} /> },
              { id: 'exams', label: 'Bài thi & Kiểm tra', icon: <FileCheck size={16} /> },
              { id: 'scores', label: 'Bảng điểm lớp HP', icon: <FileSpreadsheet size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CourseTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-5">
              {/* Form Upload & Rules */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Tải Lên Tài Liệu Học Tập</h3>
                    <p className="text-xs text-gray-500">Hỗ trợ PDF, DOCX, PPTX. Tự động kiểm tra trùng tên tệp trong lớp học phần.</p>
                  </div>
                </div>

                {fileTypeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{fileTypeError}</span>
                  </div>
                )}

                <form onSubmit={handleUploadMaterial} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nhập tên tệp (Ví dụ: Chuong_3_Mang_Doi_Tuong.pdf)..."
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Upload size={15} />
                    Tải lên tài liệu
                  </button>
                </form>
              </div>

              {/* Material List with Checkbox for AI */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Danh Sách Tài Liệu & Lựa Chọn Cho AI</h3>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
                    {materials.filter((m) => m.selectedForAI).length} / {materials.length} tệp đã chọn cho AI
                  </span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={mat.selectedForAI}
                            onChange={() => toggleSelectForAI(mat.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-gray-900 hover:text-blue-600">
                            {mat.fileName}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{mat.fileSize}</span>
                        <span>{mat.uploadedAt}</span>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                          <Download size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Danh Sách Sinh Viên Đã Ghi Danh</h3>
                    <p className="text-xs text-gray-500">Giảng viên theo dõi danh sách sinh viên thuộc lớp học phần do phòng đào tạo/admin quản lý.</p>
                  </div>

                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
                    {studentList.length} sinh viên
                  </span>
                </div>
              </div>

              {/* Student Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">MSSV</th>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Ngày ghi danh</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {studentList.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-400">{idx + 1}</td>
                        <td className="p-4 font-bold text-gray-900">{st.studentCode}</td>
                        <td className="p-4 font-semibold text-gray-800">{st.fullName}</td>
                        <td className="p-4 text-gray-500">{st.email}</td>
                        <td className="p-4 text-gray-400">{st.enrolledAt}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                            Đang học
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Bảng Tin Lớp Học Phần</h3>
                  <p className="text-xs text-gray-500">Đăng thông báo, nhắc nhở lịch thi và đính kèm tệp tài liệu cho sinh viên.</p>
                </div>
                <button
                  onClick={() => setIsAnnModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus size={16} /> Tạo Thông Báo Mới
                </button>
              </div>

              {/* Announcement List Timeline */}
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                        <span className="text-[11px] text-gray-400">Đăng bởi {ann.teacherName} • {ann.createdAt}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{ann.content}</p>

                    {ann.attachedFileName && (
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 font-medium">
                          <Paperclip size={14} className="text-blue-600 shrink-0" />
                          <span>File đính kèm: <strong>{ann.attachedFileName}</strong></span>
                          <button className="p-1 hover:text-blue-600">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXAMS */}
          {activeTab === 'exams' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Danh Sách Bài Thi Của Lớp</h3>
                <button
                  onClick={() => navigate('/teacher/exams/create')}
                  className="px-3.5 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus size={15} /> Tạo bài thi mới
                </button>
              </div>

              <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Bài Thi Giữa Kỳ Java</h4>
                  <p className="text-[11px] text-gray-500">60 phút • 3 câu hỏi (10 điểm)</p>
                </div>
                <button
                  onClick={() => navigate('/teacher/exams/ex-01')}
                  className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg"
                >
                  Xem bài nộp
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SCORES */}
          {activeTab === 'scores' && (
            <div className="space-y-5">
              {/* Score Controls */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                    <input
                      type="checkbox"
                      checked={isScoresPublished}
                      onChange={(e) => setIsScoresPublished(e.target.checked)}
                      className="rounded accent-emerald-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-emerald-800">
                      Công bố điểm các bài thi trong lớp
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => alert('Đã xuất Bảng điểm Lớp Học Phần ra tệp Excel thành công!')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={15} /> Export Bảng Điểm Excel
                </button>
              </div>

              {/* Scores Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-4">MSSV</th>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Điểm Giữa Kỳ (40%)</th>
                      <th className="p-4">Điểm Cuối Kỳ (60%)</th>
                      <th className="p-4">Điểm Tổng Kết</th>
                      <th className="p-4 text-right">Trạng thái công bố</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_STUDENT_SCORES.map((sc, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{sc.studentCode}</td>
                        <td className="p-4 font-semibold text-gray-800">{sc.fullName}</td>
                        <td className="p-4 text-gray-700">{sc.midtermScore ?? '-'}</td>
                        <td className="p-4 text-gray-700">{sc.finalScore ?? '-'}</td>
                        <td className="p-4 font-semibold text-gray-800">{sc.averageScore ?? '-'}</td>
                        <td className="p-4 text-right">
                          <AppBadge tone={isScoresPublished ? 'emerald' : 'gray'} className="font-bold">
                            {isScoresPublished ? 'Đã công bố' : 'Ẩn với sinh viên'}
                          </AppBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Announcement Modal (Bảng tin Lớp học kèm File đính kèm) */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">Đăng Thông Báo Mới Cho Lớp</h3>
              <button onClick={() => setIsAnnModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu Đề Thông Báo</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thông báo lịch ôn tập giữa kỳ..."
                  value={annTitleInput}
                  onChange={(e) => setAnnTitleInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập chi tiết nội dung thông báo gửi đến sinh viên..."
                  value={annContentInput}
                  onChange={(e) => setAnnContentInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tệp Đính Kèm (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Tên tệp đính kèm (Ví dụ: De_Thi_Mau_Tham_Khao.pdf)..."
                  value={annFileInput}
                  onChange={(e) => setAnnFileInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Đăng thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
