import type { CourseHeaderResponseDto } from "../dtos/course-header.response.dto";
import type { TimelineResponseDto, PostTimelineItemDto, ExamTimelineItemDto } from "../dtos/timeline.response.dto";
import type { PostDetailResponseDto } from "../dtos/post-detail.response.dto";
import type { ExamDetailResponseDto } from "../dtos/exam-detail.response.dto";
import type { MemberResponseDto } from "../dtos/member.response.dto";
import type { ScoreResponseDto } from "../dtos/score.response.dto";
import {
  ExamAvailabilityStatus,
  MemberRole,
} from "../types/student-course-detail.types";

export class StudentCourseDetailMapper {
  // ────────────────────────────────────────────────────────────
  // Course Header
  // ────────────────────────────────────────────────────────────
  public toCourseHeaderResponse(
    row: CourseOfferingRow,
  ): CourseHeaderResponseDto {
    return {
      courseOfferingId: row.id,
      subjectId: row.subject.id,
      subjectCode: row.subject.code,
      subjectName: row.subject.name,
      courseCode: row.courseCode,
      teacherName: row.teacher.user.fullName,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Timeline - POST
  // ────────────────────────────────────────────────────────────
  public toPostTimelineResponse(row: PostTimelineRow): PostTimelineItemDto {
    const edited = row.updatedAt > row.createdAt
    const hasAttachment = (row.attachments?.length || 0) > 0

    return {
      id: row.id,
      courseOfferingId: row.courseOfferingId,
      type: 'POST',
      title: row.title,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      edited,
      hasAttachment,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Timeline - EXAM
  // ────────────────────────────────────────────────────────────
  public toExamTimelineResponse(row: ExamTimelineRow): ExamTimelineItemDto {
    return {
      id: row.id,
      courseOfferingId: row.courseOfferingId,
      type: 'EXAM',
      title: row.title,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
    }
  }

  // ────────────────────────────────────────────────────────────
  // Timeline - Full Response
  // ────────────────────────────────────────────────────────────
  public toTimelineResponse(
    posts: PostTimelineRow[],
    exams: ExamTimelineRow[],
    totalPosts: number,
    totalExams: number,
    page: number,
    pageSize: number,
  ): TimelineResponseDto {
    // Merge posts and exams
    const merged = [
      ...posts.map((p) => this.toPostTimelineResponse(p)),
      ...exams.map((e) => this.toExamTimelineResponse(e)),
    ]

    // Sort by publishedAt DESC
    merged.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

    // Calculate pagination
    const totalItems = totalPosts + totalExams
    const totalPages = Math.ceil(totalItems / pageSize)

    const items = merged.slice((page - 1) * pageSize, page * pageSize)

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    }
  }

  // ────────────────────────────────────────────────────────────
  // Post Detail
  // ────────────────────────────────────────────────────────────
  public toPostDetailResponse(): PostDetailResponseDto {
    // TODO: Implement mapping logic
    return {
      id: "",
      title: "",
      content: "",
      publishedAt: new Date(),
      updatedAt: new Date(),
      edited: false,
      attachments: [],
    };
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  public toExamDetailResponse(): ExamDetailResponseDto {
    // TODO: Implement mapping logic
    return {
      id: "",
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(),
      durationMinutes: 0,
      maxAttempts: 0,
      attemptUsed: 0,
      remainingAttempts: 0,
      canStart: false,
      status: ExamAvailabilityStatus.NOT_STARTED,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Member
  // ────────────────────────────────────────────────────────────
  public toMemberResponse(): MemberResponseDto {
    // TODO: Implement mapping logic
    return {
      id: "",
      role: MemberRole.STUDENT,
      fullName: "",
    };
  }

  // ────────────────────────────────────────────────────────────
  // Score
  // ────────────────────────────────────────────────────────────
  public toScoreResponse(): ScoreResponseDto {
    // TODO: Implement mapping logic
    return {
      examId: "",
      title: "",
      type: "",
      score: null,
    };
  }
}

// ==================
// Interfaces for Prisma data rows
// ==================

interface CourseOfferingRow {
  id: string;
  subject: {
    id: string;
    code: string;
    name: string;
  };
  courseCode: string;
  teacher: {
    user: {
      fullName: string;
    };
  };
}

interface PostTimelineRow {
  id: string;
  courseOfferingId: string;
  title: string;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  attachments?: { id: string }[];
}

interface ExamTimelineRow {
  id: string;
  courseOfferingId: string;
  title: string;
  authorName: string;
  publishedAt: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}