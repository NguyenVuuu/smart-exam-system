import { useCallback, useEffect, useState } from 'react'
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
  uploadCourseMaterials,
  type PostPayload,
} from '../api/teacher-courses.api'
import { toCourseMaterial, toTeacherCourseDetail } from '../mappers/teacher-course.mapper'
import type { TeacherCourseDetail } from '../types/teacher-course.types'

export function useTeacherCourseDetail(id?: string) {
  const [data, setData] = useState<TeacherCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setData(toTeacherCourseDetail(await getTeacherCourseDetail(id)))
    } catch {
      setData(null)
      setError('Không thể tải chi tiết lớp học phần.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  const mutatePost = async (operation: () => Promise<unknown>) => {
    await operation()
    await load()
  }

  return {
    data,
    loading,
    error,
    retry: load,
    createPost: (payload: PostPayload) => mutatePost(() => createCoursePost(id!, payload)),
    updatePost: (postId: string, payload: PostPayload) => mutatePost(() => updateCoursePost(id!, postId, payload)),
    pinPost: (postId: string, pinned: boolean) => mutatePost(() => pinCoursePost(id!, postId, pinned)),
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
