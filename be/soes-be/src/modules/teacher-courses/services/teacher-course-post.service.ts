import { NotFoundError } from '../../../errors/AppError'
import { toPostDto } from '../mappers/teacher-course.mapper'
import * as repo from '../repositories/teacher-course-post.repository'
import type { PostBody } from '../validators/teacher-course-post.validator'

const requireCourse = async (teacherId: string, courseId: string) => {
  if (!await repo.findOwnedCourse(teacherId, courseId)) throw new NotFoundError('Course offering not found')
}
const requirePost = async (teacherId: string, courseId: string, postId: string) => {
  const post = await repo.findOwnedPost(teacherId, courseId, postId)
  if (!post) throw new NotFoundError('Post not found')
  return post
}

export async function create(teacherId: string, courseId: string, data: PostBody) {
  await requireCourse(teacherId, courseId)
  return toPostDto(await repo.createPost(teacherId, courseId, data))
}
export async function update(teacherId: string, courseId: string, postId: string, data: PostBody) {
  await requirePost(teacherId, courseId, postId)
  return toPostDto(await repo.updatePost(postId, data))
}
export async function setPinned(teacherId: string, courseId: string, postId: string, isPinned: boolean) {
  await requirePost(teacherId, courseId, postId)
  return toPostDto(await repo.setPostPinned(postId, isPinned))
}
export async function remove(teacherId: string, courseId: string, postId: string) {
  await requirePost(teacherId, courseId, postId)
  await repo.deletePost(postId)
  return { removed: true }
}
