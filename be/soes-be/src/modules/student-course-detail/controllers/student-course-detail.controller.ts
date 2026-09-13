import { NextFunction, Request, Response } from "express";
import { studentCourseDetailService } from "../services/student-course-detail.service";
import { NotFoundError } from "../../../errors/AppError";
import { membersQuerySchema, timelineQuerySchema } from "../validators/student-course-detail.validator";

export async function getCourseHeader(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;

    const data = await studentCourseDetailService.getCourseHeader(
      studentId,
      courseOfferingId,
    );

    res.status(200).json({
      success: true,
      message: "Course loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTimeline(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const { page, pageSize } = timelineQuerySchema.parse(req.query);

    const data = await studentCourseDetailService.getTimeline(
      studentId,
      courseOfferingId,
      page,
      pageSize,
    );

    res.status(200).json({
      success: true,
      message: "Timeline loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const postId = req.params.postId as string;

    const data = await studentCourseDetailService.getPostDetail(
      studentId,
      courseOfferingId,
      postId,
    );

    if (!data) {
      throw new NotFoundError("Not found");
    }

    res.status(200).json({
      success: true,
      message: "Post loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMaterials(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const data = await studentCourseDetailService.getMaterials(studentId, courseOfferingId);

    res.status(200).json({
      success: true,
      message: "Materials loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const materialId = req.params.materialId as string;
    const file = await studentCourseDetailService.downloadMaterial(studentId, courseOfferingId, materialId);

    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.send(file.buffer);
  } catch (err) {
    next(err);
  }
}

export async function getExamDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const scheduleId = req.params.scheduleId as string;

    const data = await studentCourseDetailService.getExamDetail(
      studentId,
      courseOfferingId,
      scheduleId,
    );

    if (!data) {
      throw new NotFoundError("Exam schedule not found");
    }

    res.status(200).json({
      success: true,
      message: "Exam loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;
    const { page, pageSize } = membersQuerySchema.parse(req.query);

    const data = await studentCourseDetailService.getMembers(
      studentId,
      courseOfferingId,
      page,
      pageSize,
    );

    res.status(200).json({
      success: true,
      message: "Members loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getScores(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const studentId = req.user!.profileId;
    const courseOfferingId = req.params.courseOfferingId as string;

    const data = await studentCourseDetailService.getScores(
      studentId,
      courseOfferingId,
    );

    res.status(200).json({
      success: true,
      message: "Scores loaded successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}
