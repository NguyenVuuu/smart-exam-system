import prisma from '../../../lib/prisma'
import { MemberRole } from '../types/student-course-detail.types'
import { NotFoundError } from '../../../errors/AppError'
import { ExamStatus, PostStatus, AttemptStatus } from '@prisma/client'

export class StudentCourseDetailRepository {
  // ────────────────────────────────────────────────────────────
  // Course Header
  // ────────────────────────────────────────────────────────────
  async findCourseHeader(
    courseOfferingId: string,
    studentId: string,
  ): Promise<CourseHeaderRow | null> {
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      select: {
        id: true,
        code: true,
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    })

    if (!courseOffering) {
      throw new NotFoundError('Not found')
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseOfferingId,
        studentId,
      },
      select: { id: true },
    })

    if (!enrollment) {
      throw new NotFoundError('Not found')
    }

    return {
      id: courseOffering.id,
      courseCode: courseOffering.code,
      subject: courseOffering.subject,
      teacher: courseOffering.teacher,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Timeline
  // ────────────────────────────────────────────────────────────
  async findTimeline(
    courseOfferingId: string,
    page: number,
    pageSize: number,
  ): Promise<{ posts: any[]; exams: any[]; totalPosts: number; totalExams: number }> {
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      select: { id: true },
    })

    if (!courseOffering) {
      throw new NotFoundError('Not found')
    }

    const posts = await prisma.post.findMany({
      where: {
        courseOfferingId,
        status: PostStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        courseOfferingId: true,
        title: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
        createdBy: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        attachments: {
          select: { id: true },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    const exams = await prisma.exam.findMany({
      where: {
        courseOfferingId,
        status: ExamStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        courseOfferingId: true,
        title: true,
        publishedAt: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        createdBy: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    return {
      posts,
      exams,
      totalPosts: posts.length,
      totalExams: exams.length,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Post Detail
  // ────────────────────────────────────────────────────────────
  async findPostDetail(
    courseOfferingId: string,
    postId: string,
  ): Promise<PostDetailRow | null> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        courseOfferingId,
        status: PostStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
        attachments: {
          select: {
            id: true,
            fileName: true,
            contentType: true,
            fileSize: true,
            objectName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!post) {
      return null
    }

    const attachments = post.attachments.map(attachment => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: this.getFileType(attachment.contentType),
      fileSize: this.formatFileSize(attachment.fileSize),
      downloadUrl: this.generateDownloadUrl(attachment.objectName),
    }))

    const edited = post.updatedAt > post.createdAt

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      publishedAt: post.publishedAt!,
      updatedAt: post.updatedAt,
      edited,
      attachments,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  async findExamDetail(
    courseOfferingId: string,
    examId: string,
    studentId: string,
  ): Promise<ExamDetailRow | null> {
    // First verify student has access to this course offering
    await this.findCourseHeader(courseOfferingId, studentId)

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        courseOfferingId,
        status: ExamStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        maxAttempts: true,
        status: true,
        publishedAt: true,
        examAttempts: {
          where: { studentId },
        },
      },
    })

    if (!exam) {
      return null
    }

    const now = new Date()

    // Find the student's attempt (if any)
    const studentAttempt = exam.examAttempts[0]

    // Determine status based on priority
    let status: string
    let canStart = false
    let attemptUsed = 0
    let remainingAttempts = exam.maxAttempts

    if (studentAttempt && studentAttempt.status === AttemptStatus.SUBMITTED) {
      // Student has submitted
      status = 'SUBMITTED'
      attemptUsed = 1
      remainingAttempts = exam.maxAttempts - attemptUsed
      canStart = false
    } else if (now < exam.startTime) {
      // Before start time
      status = 'NOT_STARTED'
      attemptUsed = 0
      remainingAttempts = exam.maxAttempts
      canStart = false
    } else if (now >= exam.endTime) {
      // After end time
      if (studentAttempt) {
        // Student started but not submitted
        status = 'EXPIRED'
        attemptUsed = 1
        remainingAttempts = 0
      } else {
        // Student never started
        status = 'EXPIRED'
        attemptUsed = 0
        remainingAttempts = exam.maxAttempts
      }
      canStart = false
    } else {
      // During active exam window
      if (studentAttempt && studentAttempt.status === AttemptStatus.IN_PROGRESS) {
        // Student is currently working on the exam
        status = 'AVAILABLE'
        attemptUsed = 1
        remainingAttempts = exam.maxAttempts - attemptUsed
        canStart = true
      } else {
        // Student hasn't started yet
        status = 'AVAILABLE'
        attemptUsed = 0
        remainingAttempts = exam.maxAttempts
        canStart = true
      }
    }

    // Calculate remaining seconds
    let remainingSeconds: number | null = null
    if (status === 'AVAILABLE' && studentAttempt && studentAttempt.status === AttemptStatus.IN_PROGRESS) {
      // Calculate remaining time based on deadline
      // deadline = startedAt + durationMinutes
      const startedAt = studentAttempt.startedAt
      const deadline = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000)
      remainingSeconds = Math.floor((deadline.getTime() - now.getTime()) / 1000)
      if (remainingSeconds < 0) remainingSeconds = 0
    } else if (status === 'AVAILABLE' && !studentAttempt) {
      // Student hasn't started yet - full time available
      remainingSeconds = exam.durationMinutes * 60
    }

    // Calculate canResume
    const canResume = status === 'AVAILABLE' && studentAttempt && studentAttempt.status === AttemptStatus.IN_PROGRESS

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description || '',
      startTime: exam.startTime,
      endTime: exam.endTime,
      durationMinutes: exam.durationMinutes,
      maxAttempts: exam.maxAttempts,
      attemptUsed,
      remainingAttempts,
      canStart,
      status,
      remainingSeconds,
      canResume,
      attemptId: studentAttempt ? studentAttempt.id : null,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Members
  // ────────────────────────────────────────────────────────────
  async findMembers(
    courseOfferingId: string,
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<MembersRow> {
    // First verify student has access to this course offering
    await this.findCourseHeader(courseOfferingId, studentId)

    // Get teachers for this course offering
    const teachers = await prisma.teacher.findMany({
      where: { courseOfferings: { some: { id: courseOfferingId } } },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    })

    // Get students enrolled in this course offering
    const students = await prisma.student.findMany({
      where: { enrollments: { some: { courseOfferingId } } },
      select: {
        id: true,
        studentCode: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    })

    // Sort students by last name (tên) in ascending order
    const sortedStudents = students.sort((a, b) => {
      const lastNameA = a.user.fullName.trim().split(' ').pop() || ''
      const lastNameB = b.user.fullName.trim().split(' ').pop() || ''
      return lastNameA.localeCompare(lastNameB, 'vi')
    })

    const totalItems = teachers.length + sortedStudents.length
    const totalPages = Math.ceil(totalItems / pageSize)

    // Combine teachers and students
    const allItems = [
      ...teachers.map((t) => ({
        id: t.id,
        role: MemberRole.TEACHER,
        fullName: t.user.fullName,
        studentCode: null,
      })),
      ...sortedStudents.map((s) => ({
        id: s.id,
        role: MemberRole.STUDENT,
        fullName: s.user.fullName,
        studentCode: s.studentCode,
      })),
    ]

    // Apply pagination
    const start = (page - 1) * pageSize
    const paginatedItems = allItems.slice(start, start + pageSize)

    return {
      items: paginatedItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    }
  }

  // ────────────────────────────────────────────────────────────
  // Scores
  // ────────────────────────────────────────────────────────────
  async findScores(courseOfferingId: string, studentId: string): Promise<ScoreRow[]> {
    // First verify student has access to this course offering
    await this.findCourseHeader(courseOfferingId, studentId)

    const exams = await prisma.exam.findMany({
      where: {
        courseOfferingId,
        status: ExamStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        publishedAt: true,
        examAttempts: {
          where: { studentId },
          select: {
            totalScore: true,
            isPublished: true,
            updatedAt: true,
          },
          orderBy: {
            attemptNo: 'desc',
          },
          take: 1,
        },
      },
    })

    const rawScores = exams
      .map((exam) => {
        const latestAttempt = exam.examAttempts[0]
        // Only include exams where the student's score has been published
        if (!latestAttempt || !latestAttempt.isPublished || latestAttempt.totalScore === null) {
          return null
        }
        return {
          examId: exam.id,
          title: exam.title,
          type: exam.type as string,
          score: latestAttempt.totalScore.toNumber(),
          publishedAt: exam.publishedAt!,
        }
      })
      .filter((item): item is ScoreRow => item !== null)

    return rawScores.sort((a, b) => {
      const publishedCompare = a.publishedAt.getTime() - b.publishedAt.getTime()
      if (publishedCompare !== 0) {
        return publishedCompare
      }
      return a.examId.localeCompare(b.examId)
    })
  }

  private getFileType(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/zip': 'ZIP',
      'application/x-zip-compressed': 'ZIP',
    }
    return map[contentType] || contentType.split('/')[1]?.toUpperCase() || 'UNKNOWN'
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  private generateDownloadUrl(objectName: string): string {
    return `/files/${objectName}`
  }
}

// ==================
// Interfaces for Prisma data rows
// ==================

export interface CourseHeaderRow {
  id: string
  courseCode: string
  subject: {
    id: string
    code: string
    name: string
  }
  teacher: {
    user: {
      fullName: string
    }
  }
}

export interface TimelineRow {
  items: any[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface PostDetailRow {
  id: string
  title: string
  content: string
  publishedAt: Date
  updatedAt: Date
  edited: boolean
  attachments: {
    id: string
    fileName: string
    fileType: string
    fileSize: string
    downloadUrl: string
  }[]
}

export interface ExamDetailRow {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  maxAttempts: number
  attemptUsed: number
  remainingAttempts: number
  canStart: boolean
  status: string
  remainingSeconds?: number | null
  canResume?: boolean
  attemptId?: string | null
}

export interface MembersRow {
  items: {
    id: string
    role: MemberRole
    fullName: string
    studentCode: string | null
  }[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface ScoreRow {
  examId: string
  title: string
  type: string
  score: number
  publishedAt: Date
}