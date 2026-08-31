import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/teacher-courses.service'
import { courseCollectionQuerySchema, teacherCoursesQuerySchema } from '../validators/teacher-courses.validator'
import { z } from 'zod'
import * as postService from '../services/teacher-course-post.service'
import { postBodySchema, postPinSchema } from '../validators/teacher-course-post.validator'
import { unlink } from 'fs/promises'

export const listCourses = async (req: Request, res: Response) => send(res, await service.list(req.user!.profileId, teacherCoursesQuerySchema.parse(req.query)))
export const getCourse = async (req: Request, res: Response) => send(res, await service.get(req.user!.profileId, z.string().min(1).parse(req.params.id)))
export const listProctorAssignments = async (req: Request, res: Response) => send(res, await service.listProctorAssignments(req.user!.profileId))
export const listStudents = async (req: Request, res: Response) => send(res, await service.listStudents(req.user!.profileId, z.string().min(1).parse(req.params.id), courseCollectionQuerySchema.parse(req.query)))
export const listExams = async (req: Request, res: Response) => send(res, await service.listExams(req.user!.profileId, z.string().min(1).parse(req.params.id), courseCollectionQuerySchema.parse(req.query)))
export const getGradebook = async (req: Request, res: Response) => send(res, await service.getGradebook(req.user!.profileId, z.string().min(1).parse(req.params.id), courseCollectionQuerySchema.parse(req.query)))
const postParams = z.object({ id: z.string().min(1), postId: z.string().min(1).optional() })
const uploadedFiles = (req: Request) => (req.files as Express.Multer.File[] | undefined) ?? []
const savePost = async (req: Request, work: (files: Express.Multer.File[]) => Promise<unknown>) => {
  const files = uploadedFiles(req)
  try { return await work(files) }
  catch (error) {
    await Promise.all(files.map(({ path }) => unlink(path).catch(() => undefined)))
    throw error
  }
}
export const createPost = async (req: Request, res: Response) => {
  const { id } = postParams.parse(req.params)
  send(res, await savePost(req, (files) => postService.create(
    req.user!.profileId, id, postBodySchema.parse(req.body), files,
  )))
}
export const updatePost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params)
  send(res, await savePost(req, (files) => postService.update(
    req.user!.profileId, id, postId!, postBodySchema.parse(req.body), files,
  )))
}
export const pinPost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params)
  send(res, await postService.setPinned(req.user!.profileId, id, postId!, postPinSchema.parse(req.body).isPinned))
}
export const deletePost = async (req: Request, res: Response) => {
  const { id, postId } = postParams.parse(req.params)
  send(res, await postService.remove(req.user!.profileId, id, postId!))
}
export const downloadPostAttachment = async (req: Request, res: Response) => {
  const params = z.object({
    id: z.string().min(1), postId: z.string().min(1), attachmentId: z.string().min(1),
  }).parse(req.params)
  const file = await postService.download(req.user!.profileId, params.id, params.postId, params.attachmentId)
  res.download(file.storagePath, file.fileName)
}
