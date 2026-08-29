import { useCallback, useEffect, useState } from 'react'
import { createCoursePost, deleteCoursePost, getTeacherCourseDetail, pinCoursePost, updateCoursePost } from '../api/teacher-courses.api'
import { toTeacherCourseDetail } from '../mappers/teacher-course.mapper'
import type { TeacherCourseDetail } from '../types/teacher-course.types'

export function useTeacherCourseDetail(id?: string) {
  const [data, setData] = useState<TeacherCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try { setData(toTeacherCourseDetail(await getTeacherCourseDetail(id))) }
    catch { setData(null); setError('Không thể tải chi tiết lớp học phần.') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])
  const mutatePost = async (operation: () => Promise<unknown>) => { await operation(); await load() }
  return {
    data, loading, error, retry: load,
    createPost: (payload: { title: string; content: string }) => mutatePost(() => createCoursePost(id!, payload)),
    updatePost: (postId: string, payload: { title: string; content: string }) => mutatePost(() => updateCoursePost(id!, postId, payload)),
    pinPost: (postId: string, pinned: boolean) => mutatePost(() => pinCoursePost(id!, postId, pinned)),
    deletePost: (postId: string) => mutatePost(() => deleteCoursePost(id!, postId)),
  }
}
