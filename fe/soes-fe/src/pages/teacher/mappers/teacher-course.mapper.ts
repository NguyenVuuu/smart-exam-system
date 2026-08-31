import type { TeacherCourseDetailApiDto } from '../types/teacher-course-api.types'
import type { TeacherCourseDetail } from '../types/teacher-course.types'

const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', hour12: false,
}).format(new Date(value))

const fileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const fileType = (contentType: string, fileName: string): 'PDF' | 'DOCX' | 'PPTX' => {
  if (contentType.includes('presentation') || fileName.toLowerCase().endsWith('.pptx')) return 'PPTX'
  if (contentType.includes('word') || fileName.toLowerCase().endsWith('.docx')) return 'DOCX'
  return 'PDF'
}

export function toTeacherCourseDetail(dto: TeacherCourseDetailApiDto): TeacherCourseDetail {
  return {
    course: {
      id: dto.id, courseCode: dto.code, status: dto.status,
      semesterId: dto.semester.id, semesterCode: dto.semester.code, semesterName: dto.semester.name,
      semesterStatus: dto.semester.status,
      subjectId: dto.subject.id, subjectCode: dto.subject.code, subjectName: dto.subject.name,
      teacherName: dto.teacher.fullName, totalStudents: dto.enrollmentCount,
      totalExams: dto.scheduleCount,
    },
    students: dto.students.map((student) => ({
      ...student, email: student.email ?? '', enrolledAt: dateTime(student.enrolledAt), status: 'ACTIVE',
    })),
    materials: dto.materials.map((material) => ({
      id: material.id, courseOfferingId: dto.id, fileName: material.fileName,
      fileType: fileType(material.contentType, material.fileName), fileSize: fileSize(material.fileSize),
      uploadedAt: dateTime(material.createdAt), selectedForAI: material.aiEnabled, downloadUrl: '#',
    })),
    announcements: dto.posts.map((post) => ({
      id: post.id, title: post.title, content: post.content,
      createdAt: dateTime(post.publishedAt ?? post.createdAt), teacherName: post.teacherName,
      pinned: post.isPinned,
      attachedFiles: post.attachments.map((file) => ({ id: file.id, name: file.fileName, size: fileSize(file.fileSize) })),
    })),
    exams: dto.exams,
  }
}
