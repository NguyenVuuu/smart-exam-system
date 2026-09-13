import type { CourseHeaderResponseDto } from "../dtos/course-header.response.dto";
import type { TimelineResponseDto } from "../dtos/timeline.response.dto";
import type { PostDetailResponseDto } from "../dtos/post-detail.response.dto";
import type { ExamDetailResponseDto } from "../dtos/exam-detail.response.dto";
import type { MemberResponseDto } from "../dtos/member.response.dto";
import type { ScoreResponseDto } from "../dtos/score.response.dto";
import { StudentCourseDetailRepository } from "../repositories/student-course-detail.repository";
import { StudentCourseDetailMapper } from "../mappers/student-course-detail.mapper";
import { NotFoundError } from "../../../errors/AppError";
import { MemberRole } from "../types/student-course-detail.types";
import { downloadBufferFromBucket } from "../../../services/storage.service";
import { supabaseBuckets } from "../../../lib/supabase";

const repo = new StudentCourseDetailRepository();
const mapper = new StudentCourseDetailMapper();

export class StudentCourseDetailService {
  // ────────────────────────────────────────────────────────────
  // Course Header
  // ────────────────────────────────────────────────────────────
  async getCourseHeader(
    studentId: string,
    courseOfferingId: string,
  ): Promise<CourseHeaderResponseDto> {
    const row = await repo.findCourseHeader(courseOfferingId, studentId);

    if (!row) {
      throw new NotFoundError("Not found")
    }

    return mapper.toCourseHeaderResponse(row);
  }


  // ────────────────────────────────────────────────────────────
  // Timeline
  // ────────────────────────────────────────────────────────────
  async getTimeline(
    studentId: string,
    courseOfferingId: string,
    page: number,
    pageSize: number,
  ): Promise<TimelineResponseDto> {
    await repo.findCourseHeader(courseOfferingId, studentId)

    const { posts, exams, totalPosts, totalExams } = await repo.findTimeline(courseOfferingId, page, pageSize)

    const transformedPosts = posts.map((p) => ({
      id: p.id,
      courseOfferingId: p.courseOfferingId,
      title: p.title,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      authorName: p.createdBy?.user?.fullName || '',
      attachments: p.attachments,
    }))

    const transformedExams = exams.map((e) => ({
      id: e.id,
      courseOfferingId: e.courseOfferingId,
      title: e.title,
      publishedAt: e.publishedAt,
      startTime: e.startTime,
      endTime: e.endTime,
      durationMinutes: e.durationMinutes,
      authorName: e.createdBy?.user?.fullName || '',
    }))

    return mapper.toTimelineResponse(transformedPosts, transformedExams, totalPosts, totalExams, page, pageSize)
  }

  // ────────────────────────────────────────────────────────────
  // Post Detail
  // ────────────────────────────────────────────────────────────
  async getPostDetail(
    studentId: string,
    courseOfferingId: string,
    postId: string,
  ): Promise<PostDetailResponseDto | null> {
    await repo.findCourseHeader(courseOfferingId, studentId)

    const row = await repo.findPostDetail(courseOfferingId, postId);
    if (!row) return null;
    return mapper.toPostDetailResponse(row);
  }

  async getMaterials(studentId: string, courseOfferingId: string) {
    const materials = await repo.findMaterials(courseOfferingId, studentId)
    return {
      items: materials.map((material) => ({
        id: material.id,
        title: material.title,
        fileName: material.fileName,
        fileType: this.fileType(material.contentType),
        fileSize: this.fileSize(material.fileSize),
        contentType: material.contentType,
        uploadedAt: material.createdAt,
      })),
    }
  }

  async downloadMaterial(studentId: string, courseOfferingId: string, materialId: string) {
    const material = await repo.findMaterial(courseOfferingId, studentId, materialId)
    if (!material) throw new NotFoundError('Material not found')
    return {
      ...material,
      buffer: await downloadBufferFromBucket(supabaseBuckets.courseMaterials, material.storagePath),
    }
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  async getExamDetail(
    studentId: string,
    courseOfferingId: string,
    scheduleId: string,
  ): Promise<ExamDetailResponseDto | null> {
    const row = await repo.findExamDetail(courseOfferingId, scheduleId, studentId);
    if (!row) return null;
    return mapper.toExamDetailResponse(row);
  }

  // ────────────────────────────────────────────────────────────
  // Members
  // ────────────────────────────────────────────────────────────
  async getMembers(
    studentId: string,
    courseOfferingId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: MemberResponseDto[]; pagination: TimelineResponseDto["pagination"] }> {
    const { items, pagination } = await repo.findMembers(
      courseOfferingId,
      studentId,
      page,
      pageSize,
    );
    return {
      items: items.map((item) => mapper.toMemberResponse({
        id: item.id,
        role: item.role as MemberRole.TEACHER | MemberRole.STUDENT,
        fullName: item.fullName,
        studentCode: item.studentCode,
      })),
      pagination,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Scores
  // ────────────────────────────────────────────────────────────
  async getScores(studentId: string, courseOfferingId: string): Promise<{ items: ScoreResponseDto[] }> {
    const scores = await repo.findScores(courseOfferingId, studentId);
    return {
      items: scores.map((score) => mapper.toScoreResponse(score)),
    };
  }

  private fileType(contentType: string): string {
    if (contentType.includes('pdf')) return 'PDF'
    if (contentType.includes('word')) return 'DOCX'
    if (contentType.includes('presentation')) return 'PPTX'
    return contentType.split('/')[1]?.toUpperCase() || 'FILE'
  }

  private fileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
}

export const studentCourseDetailService = new StudentCourseDetailService();
