import { useAccountQuery } from '../../../hooks/useAccountQuery'
import {
  createCoursePost,
  deleteCourseMaterial,
  deleteCoursePost,
  downloadCourseMaterial,
  downloadCoursePostAttachment,
  getTeacherCourseDetail,
  pinCoursePost,
  toggleCourseMaterialAi,
  updateCoursePost,
  updateCoursePostStatus,
  uploadCourseMaterials,
  type PostPayload,
} from '../api/teacher-courses.api'
import { toCourseMaterial, toTeacherCourseDetail } from '../mappers/teacher-course.mapper'
import type { CourseMaterial } from '../types/teacher-course.types'

export function useTeacherCourseDetail(id?: string) {
  const query = useAccountQuery(['teacher-course-detail', id],
    async () => toTeacherCourseDetail(await getTeacherCourseDetail(id!)), Boolean(id))
  const data = query.isError ? null : query.data ?? null
  const load = query.reload

  const mutatePost = async (operation: () => Promise<unknown>) => {
    await operation()
    await load()
  }

  return {
    data,
    setMaterials: (update: CourseMaterial[] | ((current: CourseMaterial[]) => CourseMaterial[])) =>
      query.setData(current => current ? { ...current, materials: typeof update === 'function' ? update(current.materials) : update } : current),
    loading: query.isFetching,
    error: query.isError ? 'Không thể tải chi tiết lớp học phần.' : null,
    retry: load,
    createPost: (payload: PostPayload) => mutatePost(() => createCoursePost(id!, payload)),
    updatePost: (postId: string, payload: PostPayload) => mutatePost(() => updateCoursePost(id!, postId, payload)),
    pinPost: (postId: string, pinned: boolean) => mutatePost(() => pinCoursePost(id!, postId, pinned)),
    setPostStatus: (postId: string, status: 'DRAFT' | 'PUBLISHED') => mutatePost(() => updateCoursePostStatus(id!, postId, status)),
    deletePost: (postId: string) => mutatePost(() => deleteCoursePost(id!, postId)),
    downloadAttachment: (postId: string, attachmentId: string, fileName: string) =>
      downloadCoursePostAttachment(id!, postId, attachmentId, fileName),
    downloadMaterial: (materialId: string, fileName: string) =>
      downloadCourseMaterial(id!, materialId, fileName),
    removeMaterial: (materialId: string) => deleteCourseMaterial(id!, materialId),
    toggleMaterialAi: (materialId: string, aiEnabled: boolean) =>
      toggleCourseMaterialAi(id!, materialId, aiEnabled),
    uploadMaterials: async (files: File[]) => {
      if (!id || !data) return []
      const uploaded = await uploadCourseMaterials(id, files)
      const mapped = uploaded.map((material) => toCourseMaterial(material, {
        id: data.course.id,
        code: data.course.courseCode,
        subject: {
          id: data.course.subjectId,
          code: data.course.subjectCode,
          name: data.course.subjectName,
        },
      }))
      return mapped
    },
  }
}
