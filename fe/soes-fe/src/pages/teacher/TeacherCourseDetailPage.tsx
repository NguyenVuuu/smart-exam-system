import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Users,
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
  attachedFiles?: Array<{
    name: string
    size: string
  }>
  createdAt: string
  teacherName: string
  pinned?: boolean
}

let teacherCourseDraftIdSequence = 0

export default function TeacherCourseDetailPage() {
  const { courseOfferingId } = useParams<{ courseOfferingId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CourseTab>('materials')

  const matchedCourse = MOCK_TEACHER_COURSES.find((c) => c.id === courseOfferingId)
  const course = matchedCourse ?? MOCK_TEACHER_COURSES[0]

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
      title: 'Thông báo: lịch thi giữa kỳ Lập trình Java',
      content:
        'Ca thi giữa kỳ sẽ diễn ra lúc 08:00 ngày 15/12/2025 tại phòng máy theo lịch. Các em hãy chuẩn bị thẻ sinh viên, đăng nhập hệ thống trước 15 phút và đảm bảo camera hoạt động vì ca thi có bật chống gian lận webcam.',
      createdAt: '12/12/2025 09:00',
      teacherName: 'Nguyễn Văn An',
      pinned: true,
    },
    {
      id: 'ann-2',
      title: 'Hướng dẫn nộp bài tập tuần 4',
      content:
        'Nhắc nhở: hạn nộp bài tập tuần 4 (chủ đề vòng lặp) là 23:59 Chủ nhật tuần này. Các em nộp qua hệ thống, không nhận qua email. Nếu gặp lỗi upload hãy báo lại trong buổi học.',
      attachedFiles: [
        { name: 'BaiTap_Tuan4.pdf', size: '320 KB' },
        { name: 'HuongDan_NopBai.docx', size: '150 KB' },
      ],
      createdAt: '05/12/2025 14:30',
      teacherName: 'Nguyễn Văn An',
    },
    {
      id: 'ann-3',
      title: 'Điều chỉnh nội dung buổi học thứ 7',
      content:
        'Buổi học thứ 7 tuần này sẽ tập trung vào phần lập trình hướng đối tượng (class, object, kế thừa) thay vì cấu trúc điều khiển như dự kiến. Tài liệu đã được cập nhật trong mục Tài liệu.',
      createdAt: '28/11/2025 10:15',
      teacherName: 'Nguyễn Văn An',
    },
  ])
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
      attachedFiles: annFileInput.trim()
        ? annFileInput
            .split(',')
            .map((fileName) => fileName.trim())
            .filter(Boolean)
            .map((fileName) => ({ name: fileName, size: 'Tệp đính kèm' }))
        : undefined,
      createdAt: 'Vừa xong',
      teacherName: course.teacherName,
    }

    setAnnouncements([newAnn, ...announcements])
    setAnnTitleInput('')
    setAnnContentInput('')
    setAnnFileInput('')
  }

  const toggleAnnouncementPin = (announcementId: string) => {
    setAnnouncements((prev) =>
      prev.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, pinned: !announcement.pinned }
          : announcement,
      ),
    )
  }

  const removeAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== announcementId))
  }

  if (!matchedCourse) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <TeacherSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TeacherTopBar />
          <main className="flex-1 grid place-items-center p-6">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">Không tìm thấy lớp học phần</h1>
              <p className="mt-1 text-xs text-gray-500">Lớp học phần không tồn tại hoặc bạn không được phân công phụ trách.</p>
              <button onClick={() => navigate('/teacher/courses')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                Quay lại danh sách lớp
              </button>
            </div>
          </main>
        </div>
      </div>
    )
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
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
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
                <p className="text-xs text-gray-500 mt-1">Giảng viên phụ trách: {course.teacherName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/teacher/question-bank')}
                className="px-4.5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Sparkles size={16} className="text-amber-500" />
                AI Sinh câu hỏi từ Lớp HP
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200/80">
            {[
              { id: 'materials', label: 'Tài liệu học tập & AI', icon: <FileText size={18} /> },
              { id: 'students', label: 'Danh sách sinh viên', icon: <Users size={18} /> },
              { id: 'timeline', label: 'Bảng tin lớp học', icon: <BookOpen size={18} /> },
              { id: 'exams', label: 'Bài thi & Kiểm tra', icon: <FileCheck size={18} /> },
              { id: 'scores', label: 'Bảng điểm lớp HP', icon: <FileSpreadsheet size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CourseTab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
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
                    <h3 className="text-xs font-bold text-gray-900">Tải Lên Tài Liệu Học Tập</h3>
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
                  <h3 className="text-xs font-bold text-gray-900">Danh Sách Tài Liệu & Lựa Chọn Cho AI</h3>
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
                    <h3 className="text-xs font-bold text-gray-900">Danh Sách Sinh Viên Đã Ghi Danh</h3>
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
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
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
                        <td className="p-4 text-gray-700">{st.studentCode}</td>
                        <td className="p-4 font-semibold text-gray-800">{st.fullName}</td>
                        <td className="p-4 text-gray-500">{st.email}</td>
                        <td className="p-4 text-gray-400">{st.enrolledAt}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
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
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
              <form
                onSubmit={handleCreateAnnouncement}
                className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">Đăng thông báo</h3>
                  <p className="text-sm text-gray-500">Thông báo sẽ hiển thị cho sinh viên của lớp.</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Thông báo lịch thi giữa kỳ"
                      value={annTitleInput}
                      onChange={(e) => setAnnTitleInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Nội dung</label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Nội dung thông báo..."
                      value={annContentInput}
                      onChange={(e) => setAnnContentInput(e.target.value)}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Tệp đính kèm</label>
                    <input
                      type="text"
                      placeholder="VD: BaiTap_Tuan4.pdf, HuongDan_NopBai.docx"
                      value={annFileInput}
                      onChange={(e) => setAnnFileInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                >
                  <Send size={18} /> Đăng thông báo
                </button>
              </form>

              <div className="space-y-4">
                {[...announcements]
                  .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
                  .map((ann) => (
                    <article
                      key={ann.id}
                      className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            NV
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{ann.teacherName}</p>
                            <p className="text-sm text-gray-400">{ann.createdAt}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <Pin size={13} /> Đã ghim
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleAnnouncementPin(ann.id)}
                            title={ann.pinned ? 'Bỏ ghim thông báo' : 'Ghim thông báo'}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-blue-600"
                          >
                            {ann.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAnnouncement(ann.id)}
                            title="Xóa thông báo"
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <h4 className="text-base font-semibold leading-6 text-gray-900">{ann.title}</h4>
                        <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{ann.content}</p>
                      </div>

                      {ann.attachedFiles && ann.attachedFiles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {ann.attachedFiles.map((file) => (
                            <button
                              key={file.name}
                              type="button"
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Paperclip size={15} className="text-gray-400" />
                              <span>{file.name}</span>
                              <span className="text-gray-400">({file.size})</span>
                              <Download size={14} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXAMS */}
          {activeTab === 'exams' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900">Danh Sách Bài Thi Của Lớp</h3>
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
                  <p className="text-xs text-gray-500">60 phút • 3 câu hỏi (10 điểm)</p>
                </div>
                <button
                  onClick={() => navigate('/teacher/exams/exam-01')}
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
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
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
                        <td className="p-4 text-gray-700">{sc.studentCode}</td>
                        <td className="p-4 font-semibold text-gray-800">{sc.fullName}</td>
                        <td className="p-4 text-gray-700">{sc.midtermScore ?? '-'}</td>
                        <td className="p-4 text-gray-700">{sc.finalScore ?? '-'}</td>
                        <td className="p-4 font-semibold text-gray-800">{sc.averageScore ?? '-'}</td>
                        <td className="p-4 text-right">
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
          )}
        </main>
      </div>

    </div>
  )
}
