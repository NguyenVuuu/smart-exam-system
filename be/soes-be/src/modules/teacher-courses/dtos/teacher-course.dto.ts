export interface TeacherCourseDto {
  id: string;
  code: string;
  status: string;
  semester: { id: string; code: string; name: string; status: string };
  subject: { id: string; code: string; name: string };
  enrollmentCount: number;
  materialCount: number;
  postCount: number;
  scheduleCount: number;
}

export interface TeacherCourseDetailDto extends TeacherCourseDto {
  maxCapacity: number;
  teacher: { id: string; fullName: string };
  students: Array<{
    id: string; studentId: string; studentCode: string; fullName: string; email: string | null; enrolledAt: Date;
  }>;
  materials: Array<{
    id: string; fileName: string; fileSize: number; contentType: string; aiEnabled: boolean; createdAt: Date;
  }>;
  posts: Array<{
    id: string; title: string; content: string; status: string; publishedAt: Date | null; createdAt: Date;
    teacherName: string; isPinned: boolean; attachments: Array<{ id: string; fileName: string; fileSize: number }>;
  }>;
  exams: Array<{
    scheduleId: string; examId: string; title: string; totalPoints: number;
    startTime: Date; endTime: Date; status: string;
  }>;
}

export type TeacherCoursePostDto = TeacherCourseDetailDto['posts'][number]

export interface ProctorAssignmentDto {
  id: string;
  scheduleId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  source: 'ASSIGNED' | 'CREATED';
  courseOffering: { id: string; code: string; subjectName: string };
}

export interface CourseGradebookDto {
  assessments: Array<{
    scheduleId: string; title: string; type: string; totalPoints: number; resultsPublished: boolean
  }>
  students: Array<{
    studentId: string; studentCode: string; fullName: string
    scores: Record<string, number | null>; averageScore: number | null
  }>
}
