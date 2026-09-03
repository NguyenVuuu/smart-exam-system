import type { Request, Response } from "express";
import { sendSuccess as send } from "../../../utils/httpResponse";
import * as service from "../services/teacher-courses.service";
import {
  courseCollectionQuerySchema,
  teacherCoursesQuerySchema,
} from "../validators/teacher-courses.validator";
import { z } from "zod";
import * as postService from "../services/teacher-course-post.service";
import {
  postBodySchema,
  postPinSchema,
} from "../validators/teacher-course-post.validator";

export const listCourses = async (req: Request, res: Response) =>
  send(
    res,
    await service.list(
      req.user!.profileId,
      teacherCoursesQuerySchema.parse(req.query),
    ),
  );
export const getCourse = async (req: Request, res: Response) =>
  send(
    res,
    await service.get(
      req.user!.profileId,
      z.string().min(1).parse(req.params.id),
    ),
  );
export const listProctorAssignments = async (req: Request, res: Response) =>
  send(res, await service.listProctorAssignments(req.user!.profileId));
export const listStudents = async (req: Request, res: Response) =>
  send(
    res,
    await service.listStudents(
      req.user!.profileId,
      z.string().min(1).parse(req.params.id),
      courseCollectionQuerySchema.parse(req.query),
    ),
  );
export const uploadMaterials = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  send(
    res,
    await service.uploadMaterials(req.user!.profileId, id, uploadedFiles(req)),
    201,
  );
};
const materialParams = z.object({
  id: z.string().min(1),
  materialId: z.string().min(1),
});

export const downloadMaterial = async (req: Request, res: Response) => {
  const { id, materialId } = materialParams.parse(req.params);
  const file = await service.downloadMaterial(
    req.user!.profileId,
    id,
    materialId,
  );
  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
  );
  res.send(file.buffer);
};

export const removeMaterial = async (req: Request, res: Response) => {
  const { id, materialId } = materialParams.parse(req.params);
  send(res, await service.removeMaterial(req.user!.profileId, id, materialId));
};

export const toggleMaterialAi = async (req: Request, res: Response) => {
  const { id, materialId } = materialParams.parse(req.params);
  const body = z.object({ aiEnabled: z.boolean() }).parse(req.body);
  send(
    res,
    await service.toggleMaterialAi(
      req.user!.profileId,
      id,
      materialId,
      body.aiEnabled,
    ),
  );
};
export const listExams = async (req: Request, res: Response) =>
  send(
    res,
    await service.listExams(
      req.user!.profileId,
      z.string().min(1).parse(req.params.id),
      courseCollectionQuerySchema.parse(req.query),
    ),
  );
export const getGradebook = async (req: Request, res: Response) =>
  send(
    res,
    await service.getGradebook(
      req.user!.profileId,
      z.string().min(1).parse(req.params.id),
      courseCollectionQuerySchema.parse(req.query),
    ),
  );

const postParams = z.object({
  id: z.string().min(1),
  postId: z.string().min(1).optional(),
});
const uploadedFiles = (req: Request) =>
  (req.files as Express.Multer.File[] | undefined) ?? [];

export const createPost = async (req: Request, res: Response) => {
  const { id } = postParams.parse(req.params);
  send(
    res,
    await postService.create(
      req.user!.profileId,
      id,
      postBodySchema.parse(req.body),
      uploadedFiles(req),
    ),
  );
};

export const updatePost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params);
  send(
    res,
    await postService.update(
      req.user!.profileId,
      id,
      postId!,
      postBodySchema.parse(req.body),
      uploadedFiles(req),
    ),
  );
};

export const pinPost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params);
  send(
    res,
    await postService.setPinned(
      req.user!.profileId,
      id,
      postId!,
      postPinSchema.parse(req.body).isPinned,
    ),
  );
};

export const deletePost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params);
  send(res, await postService.remove(req.user!.profileId, id, postId!));
};

export const downloadPostAttachment = async (req: Request, res: Response) => {
  const params = z
    .object({
      id: z.string().min(1),
      postId: z.string().min(1),
      attachmentId: z.string().min(1),
    })
    .parse(req.params);
  const file = await postService.download(
    req.user!.profileId,
    params.id,
    params.postId,
    params.attachmentId,
  );
  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
  );
  res.send(file.buffer);
};
