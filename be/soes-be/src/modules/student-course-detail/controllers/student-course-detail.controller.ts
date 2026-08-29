import { NextFunction, Request, Response } from "express";
import { studentCourseDetailService } from "../services/student-course-detail.service";
import { NotFoundError } from "../../../errors/AppError";

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
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

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
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

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
