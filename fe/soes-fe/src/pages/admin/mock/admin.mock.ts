import type {
  AcademicYear,
  AdminExam,
  AdminExamSchedule,
  AdminProctorSession,
  AdminSubject,
  AdminUser,
  AuditLogItem,
  CourseOfferingAdmin,
  Department,
  SharedQuestionAdmin,
} from '../types/admin.types'

export const ADMIN_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2025-2026-hk1',
    code: 'HK1_2026',
    name: 'Học kỳ 1 năm học 2025 - 2026',
    academicYear: '2025 - 2026',
    term: 1,
    startDate: '01/09/2025',
    endDate: '31/12/2025',
    status: 'ACTIVE',
    isCurrent: true,
  },
  {
    id: 'ay-2025-2026-hk2',
    code: 'HK2_2026',
    name: 'Học kỳ 2 năm học 2025 - 2026',
    academicYear: '2025 - 2026',
    term: 2,
    startDate: '01/01/2026',
    endDate: '30/04/2026',
    status: 'CLOSED',
  },
  {
    id: 'ay-2024-2025-hk2',
    code: 'HK2_2025',
    name: 'Học kỳ 2 năm học 2024 - 2025',
    academicYear: '2024 - 2025',
    term: 2,
    startDate: '01/01/2025',
    endDate: '30/04/2025',
    status: 'ARCHIVED',
  },
]

export const ADMIN_DEPARTMENTS: Department[] = [
  { id: 'dept-se', name: 'Bộ môn Công nghệ phần mềm', headUserId: 'u-gv-an', headName: 'Nguyễn Văn An', headCode: 'GV001', subjectCount: 4 },
  { id: 'dept-is', name: 'Bộ môn Hệ thống thông tin', headUserId: 'u-gv-lan', headName: 'Trần Thị Lan', headCode: 'GV003', subjectCount: 2 },
  { id: 'dept-cs', name: 'Bộ môn Khoa học máy tính', subjectCount: 3 },
]

export const ADMIN_SUBJECTS: AdminSubject[] = [
  { id: 'sub-cs101', code: 'CS101', name: 'Lập trình Java', departmentId: 'dept-se', credits: 3, courseCount: 2, status: 'ACTIVE' },
  { id: 'sub-cs102', code: 'CS102', name: 'Cấu trúc dữ liệu và giải thuật', departmentId: 'dept-cs', credits: 3, courseCount: 1, status: 'ACTIVE' },
  { id: 'sub-cs103', code: 'CS103', name: 'Cơ sở dữ liệu', departmentId: 'dept-is', credits: 3, courseCount: 1, status: 'ACTIVE' },
  { id: 'sub-se301', code: 'SE301', name: 'Kiểm thử phần mềm', departmentId: 'dept-se', credits: 3, courseCount: 0, status: 'INACTIVE' },
]

export const ADMIN_COURSE_OFFERINGS: CourseOfferingAdmin[] = [
  { id: 'co-java-01', code: 'JAVA_01_HK1_2026', subjectCode: 'CS101', subjectName: 'Lập trình Java', semesterCode: 'HK1_2026', teacherName: 'Nguyễn Văn An', enrolled: 48, capacity: 60, status: 'OPEN' },
  { id: 'co-java-02', code: 'JAVA_02_HK1_2026', subjectCode: 'CS101', subjectName: 'Lập trình Java', semesterCode: 'HK1_2026', teacherName: 'Nguyễn Văn An', enrolled: 55, capacity: 60, status: 'OPEN' },
  { id: 'co-ds-01', code: 'DS_01_HK1_2026', subjectCode: 'CS102', subjectName: 'Cấu trúc dữ liệu và giải thuật', semesterCode: 'HK1_2026', teacherName: 'Lê Hoàng', enrolled: 44, capacity: 50, status: 'OPEN' },
  { id: 'co-db-01', code: 'DB_01_HK1_2026', subjectCode: 'CS103', subjectName: 'Cơ sở dữ liệu', semesterCode: 'HK1_2026', teacherName: 'Trần Thị Lan', enrolled: 39, capacity: 50, status: 'OPEN' },
]

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u-admin', code: 'ADM001', fullName: 'Trần Quang Huy', email: 'admin@soes.edu.vn', role: 'ADMIN', status: 'ACTIVE' },
  { id: 'u-gv-an', code: 'GV001', fullName: 'Nguyễn Văn An', email: 'an.nv@soes.edu.vn', role: 'TEACHER', departmentName: 'Bộ môn Công nghệ phần mềm', position: 'DEPARTMENT_HEAD', status: 'ACTIVE' },
  { id: 'u-gv-hoang', code: 'GV002', fullName: 'Lê Hoàng', email: 'hoang.lh@soes.edu.vn', role: 'TEACHER', departmentName: 'Bộ môn Khoa học máy tính', position: 'LECTURER', status: 'ACTIVE' },
  { id: 'u-gv-lan', code: 'GV003', fullName: 'Trần Thị Lan', email: 'lan.tt@soes.edu.vn', role: 'TEACHER', departmentName: 'Bộ môn Hệ thống thông tin', position: 'DEPARTMENT_HEAD', status: 'ACTIVE' },
  { id: 'u-sv-nam', code: 'SV2026001', fullName: 'Trần Minh Nam', email: 'nam.tm@soes.edu.vn', role: 'STUDENT', departmentName: 'Bộ môn Công nghệ phần mềm', status: 'ACTIVE' },
  { id: 'u-sv-thao', code: 'SV2026002', fullName: 'Lê Thị Thu Thảo', email: 'thao.ltt@soes.edu.vn', role: 'STUDENT', departmentName: 'Bộ môn Công nghệ phần mềm', status: 'ACTIVE' },
]

export const ADMIN_SHARED_QUESTIONS: SharedQuestionAdmin[] = [
  { id: 'sq-1', content: 'Những cách nào sau đây là cách khởi tạo một đối tượng trong Java?', subjectCode: 'CS101', type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', contributorName: 'Nguyễn Văn An', reviewedBy: 'Nguyễn Văn An', status: 'APPROVED' },
  { id: 'sq-2', content: 'Viết hàm Java kiểm tra một số nguyên n có phải số nguyên tố hay không.', subjectCode: 'CS101', type: 'PROGRAMMING', difficulty: 'HARD', contributorName: 'Nguyễn Văn An', reviewedBy: 'Nguyễn Văn An', status: 'APPROVED' },
  { id: 'sq-3', content: 'Trong Java, kiểu int có kích thước 32 bit.', subjectCode: 'CS101', type: 'TRUE_FALSE', difficulty: 'EASY', contributorName: 'Lê Hoàng', reviewedBy: 'Nguyễn Văn An', status: 'REMOVED', removedBy: 'Trần Quang Huy', removedAt: '20/12/2025 14:30', removalReason: 'Admin tạm gỡ để xử lý phản ánh trùng nội dung trong ngân hàng chung.' },
]

export const ADMIN_EXAMS: AdminExam[] = [
  { id: 'exam-mid-java', title: 'Bài thi Giữa kỳ Lập trình Java', semesterCode: 'HK1_2026', departmentId: 'dept-se', subjectCode: 'CS101', subjectName: 'Lập trình Java', authorName: 'Nguyễn Văn An', category: 'MIDTERM', structure: 'MIXED', totalPoints: 10, questionCount: 4, durationMinutes: 60, status: 'APPROVED' },
  { id: 'exam-final-java', title: 'Bài thi Cuối kỳ Lập trình Java', semesterCode: 'HK1_2026', departmentId: 'dept-se', subjectCode: 'CS101', subjectName: 'Lập trình Java', authorName: 'Nguyễn Văn An', category: 'FINAL', structure: 'MIXED', totalPoints: 10, questionCount: 4, durationMinutes: 90, status: 'PENDING_APPROVAL' },
  { id: 'exam-final-java-ready', title: 'Đề thi Cuối kỳ Lập trình Java - Đề chuẩn', semesterCode: 'HK1_2026', departmentId: 'dept-se', subjectCode: 'CS101', subjectName: 'Lập trình Java', authorName: 'Lê Hoàng', category: 'FINAL', structure: 'MIXED', totalPoints: 10, questionCount: 40, durationMinutes: 90, status: 'APPROVED' },
  { id: 'exam-quiz-ds', title: 'Bài kiểm tra Quiz Cấu trúc dữ liệu', semesterCode: 'HK1_2026', departmentId: 'dept-cs', subjectCode: 'CS102', subjectName: 'Cấu trúc dữ liệu và giải thuật', authorName: 'Lê Hoàng', category: 'QUIZ', structure: 'OBJECTIVE', totalPoints: 10, questionCount: 3, durationMinutes: 15, status: 'DRAFT' },
  { id: 'exam-final-db', title: 'Bài thi Cuối kỳ Cơ sở dữ liệu', semesterCode: 'HK1_2026', departmentId: 'dept-is', subjectCode: 'CS103', subjectName: 'Cơ sở dữ liệu', authorName: 'Trần Thị Lan', category: 'FINAL', structure: 'OBJECTIVE', totalPoints: 10, questionCount: 40, durationMinutes: 75, status: 'APPROVED' },
]

export const ADMIN_EXAM_SCHEDULES: AdminExamSchedule[] = [
  {
    id: 'sch-java-08',
    examId: 'exam-final-java-ready',
    examTitle: 'Ca thi Cuối kỳ Lập trình Java 08:00',
    subjectName: 'Lập trình Java',
    courseCodes: ['JAVA_01_HK1_2026'],
    date: '20/12/2025',
    time: '08:00 - 09:30',
    location: 'Online',
    ipPolicy: 'Không giới hạn IP',
    password: 'JAVA0815',
    distributionMode: 'Xáo câu hỏi và phương án',
    releaseMode: 'Hiện điểm ngay sau khi nộp',
    allowStudentReview: false,
    requireFullscreen: true,
    enableWebcam: true,
    blockCopyPaste: true,
    blockRightClick: true,
    proctors: ['Lê Hoàng'],
    proctorAssignments: [{ courseOfferingId: 'co-java-01', courseCode: 'JAVA_01_HK1_2026', teacherId: 'u-gv-hoang', teacherName: 'Lê Hoàng' }],
    status: 'OPEN',
  },
  {
    id: 'sch-java-13',
    examId: 'exam-final-java-ready',
    examTitle: 'Ca thi Cuối kỳ Lập trình Java 13:00',
    subjectName: 'Lập trình Java',
    courseCodes: ['JAVA_02_HK1_2026'],
    date: '20/12/2025',
    time: '13:00 - 14:30',
    location: 'Online',
    ipPolicy: 'Không giới hạn IP',
    password: 'JAVA1315',
    distributionMode: 'Xáo thứ tự câu hỏi',
    releaseMode: 'Ẩn điểm, giảng viên công bố sau',
    allowStudentReview: false,
    requireFullscreen: true,
    enableWebcam: true,
    blockCopyPaste: true,
    blockRightClick: true,
    proctors: ['Trần Thị Lan'],
    proctorAssignments: [{ courseOfferingId: 'co-java-02', courseCode: 'JAVA_02_HK1_2026', teacherId: 'u-gv-lan', teacherName: 'Trần Thị Lan' }],
    status: 'SCHEDULED',
  },
  {
    id: 'sch-final-db',
    examId: 'exam-final-db',
    examTitle: 'Ca thi Cuối kỳ Cơ sở dữ liệu 08:00',
    subjectName: 'Cơ sở dữ liệu',
    courseCodes: ['DB_01_HK1_2026'],
    date: '18/12/2025',
    time: '08:00 - 09:15',
    location: 'Online',
    ipPolicy: 'IP trường',
    password: 'DB0815',
    distributionMode: 'Xáo câu hỏi và phương án',
    releaseMode: 'Ẩn điểm, giảng viên công bố sau',
    allowStudentReview: false,
    requireFullscreen: true,
    enableWebcam: true,
    blockCopyPaste: true,
    blockRightClick: true,
    proctors: ['Nguyễn Văn An'],
    proctorAssignments: [{ courseOfferingId: 'co-db-01', courseCode: 'DB_01_HK1_2026', teacherId: 'u-gv-an', teacherName: 'Nguyễn Văn An' }],
    status: 'SCHEDULED',
  },
]

export const ADMIN_PROCTOR_SESSIONS: AdminProctorSession[] = [
  { id: 'live-java-08', scheduleName: 'Ca thi Giữa kỳ Lập trình Java 08:00', courseCode: 'JAVA_01_HK1_2026', online: 46, inProgress: 44, submitted: 2, disconnected: 1, warnings: 5, status: 'OPEN' },
  { id: 'live-java-13', scheduleName: 'Ca thi Giữa kỳ Lập trình Java 13:00', courseCode: 'JAVA_02_HK1_2026', online: 0, inProgress: 0, submitted: 0, disconnected: 0, warnings: 0, status: 'CLOSED' },
]

export const ADMIN_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'audit-1', time: '16/12/2025 09:10', actor: 'Nguyễn Văn An', action: 'SỬA ĐIỂM', entity: 'Bài làm - Lê Thị Thu Thảo', detail: 'Sửa điểm từ 9.5 lên 10.0, lý do phúc khảo câu lập trình.' },
  { id: 'audit-2', time: '15/12/2025 07:45', actor: 'Trần Minh Nam', action: 'ĐĂNG NHẬP', entity: 'Tài khoản SV2026001', detail: 'Đăng nhập thành công qua cổng Giảng viên/Sinh viên.' },
  { id: 'audit-3', time: '14/12/2025 16:40', actor: 'Trần Quang Huy', action: 'TẠO CA THI', entity: 'sch-java-13', detail: 'Tạo ca thi 13:00 cho JAVA_02_HK1_2026 và phân công giám thị.' },
]
