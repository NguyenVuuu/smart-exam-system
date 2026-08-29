import prisma from '../../../lib/prisma'
import type { PostBody } from '../validators/teacher-course-post.validator'

export const postInclude = {
  createdBy: { include: { user: { select: { fullName: true } } } },
  attachments: true,
}

export const findOwnedCourse = (teacherId: string, courseId: string) => prisma.courseOffering.findFirst({
  where: { id: courseId, teacherId }, select: { id: true },
})
export const findOwnedPost = (teacherId: string, courseId: string, postId: string) => prisma.post.findFirst({
  where: { id: postId, courseOfferingId: courseId, createdById: teacherId }, include: postInclude,
})
export const createPost = (teacherId: string, courseId: string, data: PostBody) => prisma.post.create({
  data: {
    ...data, courseOfferingId: courseId, createdById: teacherId,
    publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
  }, include: postInclude,
})
export const updatePost = (id: string, data: PostBody) => prisma.post.update({
  where: { id },
  data: { ...data, publishedAt: data.status === 'PUBLISHED' ? new Date() : null }, include: postInclude,
})
export const setPostPinned = (id: string, isPinned: boolean) => prisma.post.update({
  where: { id }, data: { isPinned }, include: postInclude,
})
export const deletePost = (id: string) => prisma.$transaction(async (tx) => {
  await tx.postAttachment.deleteMany({ where: { postId: id } })
  await tx.post.delete({ where: { id } })
})
