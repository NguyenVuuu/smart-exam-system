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
import type { PostDetailRow, ExamDetailRow, MembersRow, ScoreRow as RepoScoreRow } from "../repositories/student-course-detail.repository";

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
    const edited = row.updatedAt > row.createdAt;
    const hasAttachment = (row.attachments?.length || 0) > 0;

    return {
      id: row.id,
      courseOfferingId: row.courseOfferingId,
      type: 'POST',
      title: row.title,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      edited,
      hasAttachment,
    };
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
    };
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
    const merged = [
      ...posts.map((p) => this.toPostTimelineResponse(p)),
      ...exams.map((e) => this.toExamTimelineResponse(e)),
    ];

    merged.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    const totalItems = totalPosts + totalExams;
    const totalPages = Math.ceil(totalItems / pageSize);

    const items = merged.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  // ────────────────────────────────────────────────────────────
  // Post Detail
  // ────────────────────────────────────────────────────────────
  public toPostDetailResponse(row: PostDetailRow): PostDetailResponseDto {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      edited: row.edited,
      attachments: row.attachments,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  public toExamDetailResponse(row: ExamDetailRow): ExamDetailResponseDto {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
      maxAttempts: row.maxAttempts,
      attemptUsed: row.attemptUsed,
      remainingAttempts: row.remainingAttempts,
      canStart: row.canStart,
      requiresPassword: row.requiresPassword,
      enableWebcam: row.enableWebcam,
      status: row.status as ExamAvailabilityStatus,
      remainingSeconds: row.remainingSeconds,
      canResume: row.canResume,
      attemptId: row.attemptId,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Member
  // ────────────────────────────────────────────────────────────
  public toMemberResponse(row: MembersRow['items'][0]): MemberResponseDto {
    return {
      memberId: row.id,
      role: row.role as MemberRole,
      fullName: row.fullName,
      studentCode: row.studentCode,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Score
  // ────────────────────────────────────────────────────────────
  public toScoreResponse(row: RepoScoreRow): ScoreResponseDto {
    return {
      examId: row.examId,
      title: row.title,
      type: row.type,
      score: row.score,
      publishedAt: row.publishedAt,
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
