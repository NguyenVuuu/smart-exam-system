import prisma from '../../../lib/prisma'
import { NotFoundError } from '../../../errors/AppError'
import { ExamStatus, PostStatus } from '@prisma/client'

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
      throw new NotFoundError('Course not found')
    }

    // Check if student is enrolled in this course offering
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseOfferingId,
        studentId,
      },
      select: { id: true },
    })

    if (!enrollment) {
      throw new NotFoundError('Course not found')
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
    // First verify course offering exists
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      select: { id: true },
    })

    if (!courseOffering) {
      throw new NotFoundError('Course not found')
    }

    // Get ALL published posts with author info (no pagination at DB level)
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

    // Get ALL published exams with author info (no pagination at DB level)
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
      totalExams: exams.length 
    }
  }

  // ────────────────────────────────────────────────────────────
  // Post Detail
  // ────────────────────────────────────────────────────────────
  async findPostDetail(
    courseOfferingId: string,
    postId: string,
  ): Promise<PostDetailRow | null> {
    throw new Error('Not implemented')
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  async findExamDetail(
    courseOfferingId: string,
    examId: string,
  ): Promise<ExamDetailRow | null> {
    throw new Error('Not implemented')
  }

  // ────────────────────────────────────────────────────────────
  // Members
  // ────────────────────────────────────────────────────────────
  async findMembers(
    courseOfferingId: string,
    page: number,
    pageSize: number,
  ): Promise<MembersRow> {
    throw new Error('Not implemented')
  }

  // ────────────────────────────────────────────────────────────
  // Scores
  // ────────────────────────────────────────────────────────────
  async findScores(courseOfferingId: string): Promise<ScoreRow[]> {
    throw new Error('Not implemented')
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
  attachments: any[]
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
}

export interface MembersRow {
  items: any[]
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
  score: number | null
  publishedAt?: Date
}
