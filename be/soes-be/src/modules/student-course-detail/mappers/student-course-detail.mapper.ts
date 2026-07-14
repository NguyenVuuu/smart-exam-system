import type { CourseHeaderResponseDto } from "../dtos/course-header.response.dto";
import type { TimelineResponseDto } from "../dtos/timeline.response.dto";
import type { PostDetailResponseDto } from "../dtos/post-detail.response.dto";
import type { ExamDetailResponseDto } from "../dtos/exam-detail.response.dto";
import type { MemberResponseDto } from "../dtos/member.response.dto";
import type { ScoreResponseDto } from "../dtos/score.response.dto";
import {
  ExamAvailabilityStatus,
  MemberRole,
} from "../types/student-course-detail.types";

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
  // Timeline
  // ────────────────────────────────────────────────────────────
  public toTimelineResponse(): TimelineResponseDto {
    // TODO: Implement mapping logic
    return {
      items: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
    };
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
