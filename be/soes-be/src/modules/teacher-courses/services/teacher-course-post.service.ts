import { NotFoundError } from '../../../errors/AppError'
import { toPostDto } from '../mappers/teacher-course.mapper'
import * as repo from '../repositories/teacher-course-post.repository'
import type { PostBody } from '../validators/teacher-course-post.validator'
import { unlink } from 'fs/promises'

export interface UploadedPostFile {
  originalname: string; filename: string; size: number; mimetype: string; path: string
}

const attachmentData = (files: UploadedPostFile[]) => files.map((file) => ({
  fileName: file.originalname, objectName: file.filename, fileSize: file.size,
  contentType: file.mimetype, storagePath: file.path,
}))

const requireCourse = async (teacherId: string, courseId: string) => {
  if (!await repo.findOwnedCourse(teacherId, courseId)) throw new NotFoundError('Course offering not found')
}
const requirePost = async (teacherId: string, courseId: string, postId: string) => {
  const post = await repo.findOwnedPost(teacherId, courseId, postId)
  if (!post) throw new NotFoundError('Post not found')
  return post
}

export async function create(teacherId: string, courseId: string, data: PostBody, files: UploadedPostFile[]) {
  await requireCourse(teacherId, courseId)
  return toPostDto(await repo.createPost(teacherId, courseId, data, attachmentData(files)))
}
export async function update(teacherId: string, courseId: string, postId: string, data: PostBody, files: UploadedPostFile[]) {
  await requirePost(teacherId, courseId, postId)
  return toPostDto(await repo.updatePost(postId, data, attachmentData(files)))
}
export async function setPinned(teacherId: string, courseId: string, postId: string, isPinned: boolean) {
  await requirePost(teacherId, courseId, postId)
  return toPostDto(await repo.setPostPinned(postId, isPinned))
}
export async function remove(teacherId: string, courseId: string, postId: string) {
  await requirePost(teacherId, courseId, postId)
  const attachments = await repo.deletePost(postId)
  await Promise.all(attachments.map(({ storagePath }) => unlink(storagePath).catch(() => undefined)))
  return { removed: true }
}

export async function download(teacherId: string, courseId: string, postId: string, attachmentId: string) {
  const attachment = await repo.findAttachment(teacherId, courseId, postId, attachmentId)
  if (!attachment) throw new NotFoundError('Attachment not found')
  return attachment
}
