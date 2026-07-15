import type { CourseHeaderResponseDto } from "../dtos/course-header.response.dto";
import type { TimelineResponseDto } from "../dtos/timeline.response.dto";
import type { PostDetailResponseDto } from "../dtos/post-detail.response.dto";
import type { ExamDetailResponseDto } from "../dtos/exam-detail.response.dto";
import type { MemberResponseDto } from "../dtos/member.response.dto";
import type { ScoreResponseDto } from "../dtos/score.response.dto";
import { StudentCourseDetailRepository } from "../repositories/student-course-detail.repository";
import { StudentCourseDetailMapper } from "../mappers/student-course-detail.mapper";
import { NotFoundError } from "../../../errors/AppError";

const repo = new StudentCourseDetailRepository();
const mapper = new StudentCourseDetailMapper();

export class StudentCourseDetailService {
  // ────────────────────────────────────────────────────────────
  // Course Header
  // ────────────────────────────────────────────────────────────
  async getCourseHeader(
    studentId:string,
    courseOfferingId:string,
  ):Promise<CourseHeaderResponseDto>{
    const row = await repo.findCourseHeader(courseOfferingId,studentId);

    if(!row){
      throw new NotFoundError("Course not found")
    }
    console.log(studentId);
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
    // First verify student has access to this course offering
    await repo.findCourseHeader(courseOfferingId, studentId)

    const { posts, exams, totalPosts, totalExams } = await repo.findTimeline(courseOfferingId, page, pageSize)

    // Transform data for mapper
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
    const row = await repo.findPostDetail(courseOfferingId, postId);
    if (!row) return null;
    return mapper.toPostDetailResponse();
  }

  // ────────────────────────────────────────────────────────────
  // Exam Detail
  // ────────────────────────────────────────────────────────────
  async getExamDetail(
    studentId: string,
    courseOfferingId: string,
    examId: string,
  ): Promise<ExamDetailResponseDto | null> {
    const row = await repo.findExamDetail(courseOfferingId, examId);
    if (!row) return null;
    return mapper.toExamDetailResponse();
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
      page,
      pageSize,
    );
    return {
      items: items.map(() => mapper.toMemberResponse()),
      pagination,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Scores
  // ────────────────────────────────────────────────────────────
  async getScores(studentId: string, courseOfferingId: string): Promise<ScoreResponseDto[]> {
    const scores = await repo.findScores(courseOfferingId);
    return scores.map(() => mapper.toScoreResponse());
  }
}

export const studentCourseDetailService = new StudentCourseDetailService();
