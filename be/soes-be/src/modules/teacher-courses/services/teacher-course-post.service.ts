import { NotFoundError } from '../../../errors/AppError'
import { supabaseBuckets } from '../../../lib/supabase'
import { downloadBufferFromBucket, removeObjectsFromBucket, uploadBufferToBucket } from '../../../services/storage.service'
import { toPostDto } from '../mappers/teacher-course.mapper'
import * as repo from '../repositories/teacher-course-post.repository'
import type { PostBody } from '../validators/teacher-course-post.validator'

const attachmentData = async (courseId: string, files: Express.Multer.File[]) => {
  const prefix = `course-offerings/${courseId}/post-attachments`
  const uploaded = await Promise.all(files.map((file) => uploadBufferToBucket(supabaseBuckets.courseMaterials, file, prefix)))

  return uploaded.map((file) => ({
    fileName: file.originalName,
    objectName: file.objectName,
    fileSize: file.fileSize,
    contentType: file.contentType,
    storagePath: file.storagePath,
  }))
}

const requireCourse = async (teacherId: string, courseId: string) => {
  if (!await repo.findOwnedCourse(teacherId, courseId)) throw new NotFoundError('Course offering not found')
}

const requirePost = async (teacherId: string, courseId: string, postId: string) => {
  const post = await repo.findOwnedPost(teacherId, courseId, postId)
  if (!post) throw new NotFoundError('Post not found')
  return post
}

export async function create(teacherId: string, courseId: string, data: PostBody, files: Express.Multer.File[]) {
  await requireCourse(teacherId, courseId)
  return toPostDto(await repo.createPost(teacherId, courseId, data, await attachmentData(courseId, files)))
}

export async function update(teacherId: string, courseId: string, postId: string, data: PostBody, files: Express.Multer.File[]) {
  await requirePost(teacherId, courseId, postId)
  if (data.removedAttachmentIds?.length) {
    const removed = await repo.deleteAttachments(postId, data.removedAttachmentIds)
    if (removed.length) {
      await removeObjectsFromBucket(supabaseBuckets.courseMaterials, removed.map(({ storagePath }) => storagePath)).catch(() => undefined)
    }
  }
  return toPostDto(await repo.updatePost(postId, data, await attachmentData(courseId, files)))
}

export async function setPinned(teacherId: string, courseId: string, postId: string, isPinned: boolean) {
  await requirePost(teacherId, courseId, postId)
  return toPostDto(await repo.setPostPinned(postId, isPinned))
}

export async function remove(teacherId: string, courseId: string, postId: string) {
  await requirePost(teacherId, courseId, postId)
  const attachments = await repo.deletePost(postId)
  await removeObjectsFromBucket(supabaseBuckets.courseMaterials, attachments.map(({ storagePath }) => storagePath))
  return { removed: true }
}

export async function download(teacherId: string, courseId: string, postId: string, attachmentId: string) {
  const attachment = await repo.findAttachment(teacherId, courseId, postId, attachmentId)
  if (!attachment) throw new NotFoundError('Attachment not found')

  return {
    ...attachment,
    buffer: await downloadBufferFromBucket(supabaseBuckets.courseMaterials, attachment.storagePath),
  }
}
