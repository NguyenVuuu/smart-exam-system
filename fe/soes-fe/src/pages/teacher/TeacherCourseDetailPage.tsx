import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import CourseDetailBanner from './components/course-detail/CourseDetailBanner'
import CourseDetailNavTabs, { type CourseTab } from './components/course-detail/CourseDetailNavTabs'
import CourseExamsTab from './components/course-detail/CourseExamsTab'
import CourseMaterialsTab from './components/course-detail/CourseMaterialsTab'
import CourseScoresTab from './components/course-detail/CourseScoresTab'
import CourseStudentsTab from './components/course-detail/CourseStudentsTab'
import CourseTimelineTab, { type CourseAnnouncement } from './components/course-detail/CourseTimelineTab'
import {
  MOCK_COURSE_MATERIALS,
  MOCK_ENROLLED_STUDENTS,
  MOCK_TEACHER_COURSES,
} from './mock/teacher-course.mock'
import type { CourseMaterial, StudentEnrollment } from './types/teacher-course.types'

const INITIAL_ANNOUNCEMENTS: CourseAnnouncement[] = [
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
]

export default function TeacherCourseDetailPage() {
  const { courseOfferingId } = useParams<{ courseOfferingId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CourseTab>('materials')

  const matchedCourse = MOCK_TEACHER_COURSES.find((c) => c.id === courseOfferingId)
  const course = matchedCourse ?? MOCK_TEACHER_COURSES[0]

  const [materials, setMaterials] = useState<CourseMaterial[]>(MOCK_COURSE_MATERIALS)
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>(INITIAL_ANNOUNCEMENTS)
  const studentList: StudentEnrollment[] = MOCK_ENROLLED_STUDENTS

  if (!matchedCourse) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
        <TeacherSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TeacherTopBar />
          <main className="flex-1 grid place-items-center p-6">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">Không tìm thấy lớp học phần</h1>
              <p className="mt-1 text-sm text-gray-500">Lớp học phần không tồn tại hoặc bạn không được phân công phụ trách.</p>
              <button
                onClick={() => navigate('/teacher/courses')}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Quay lại danh sách lớp
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Quay lại danh sách lớp học phần</span>
          </button>

          {/* Banner Header */}
          <CourseDetailBanner course={course} />

          {/* Tab Navigation */}
          <CourseDetailNavTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'materials' && (
            <CourseMaterialsTab
              courseOfferingId={course.id}
              materials={materials}
              setMaterials={setMaterials}
            />
          )}

          {activeTab === 'students' && <CourseStudentsTab students={studentList} />}

          {activeTab === 'timeline' && (
            <CourseTimelineTab
              teacherName={course.teacherName}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
            />
          )}

          {activeTab === 'exams' && <CourseExamsTab />}

          {activeTab === 'scores' && <CourseScoresTab />}
        </main>
      </div>
    </div>
  )
}
