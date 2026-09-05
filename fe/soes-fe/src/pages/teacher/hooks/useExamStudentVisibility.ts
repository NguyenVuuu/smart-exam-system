import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../api/errors'
import { updateTeacherExamStudentVisibility } from '../api/teacher-exams.api'
import type { ExamStudentVisibility } from '../types/teacher-exam.types'

export function useExamStudentVisibility(examId: string, onRefresh: () => Promise<void>) {
  const [saving, setSaving] = useState(false)

  const update = async (visibility: ExamStudentVisibility) => {
    if (saving) return
    setSaving(true)
    try {
      await updateTeacherExamStudentVisibility(examId, visibility)
      await onRefresh()
      toast.success(visibility === 'HIDDEN' ? 'Đã ẩn đề khỏi sinh viên.' : 'Đã hiện đề cho sinh viên.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái hiển thị của đề thi.'))
    } finally {
      setSaving(false)
    }
  }

  return { saving, update }
}
