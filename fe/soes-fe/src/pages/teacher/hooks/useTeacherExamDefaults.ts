import { useEffect, useState } from 'react'
import { getTeacherExamDefaults } from '../api/teacher-exams.api'
import type { TeacherExamDefaultsDto } from '../types/teacher-exam-api.types'

const FALLBACK_DEFAULTS: TeacherExamDefaultsDto = {
  enableTabLock: true,
  requireFullscreen: true,
  enableWebcam: true,
  enableScreenMonitoring: false,
  blockCopyPaste: true,
  blockRightClick: true,
}

export function useTeacherExamDefaults(): TeacherExamDefaultsDto {
  const [defaults, setDefaults] = useState(FALLBACK_DEFAULTS)

  useEffect(() => {
    let active = true
    void getTeacherExamDefaults()
      .then((settings) => {
        if (active) setDefaults(settings)
      })
      .catch((error: unknown) => {
        console.error('Không thể tải cấu hình ca thi mặc định.', error)
      })

    return () => {
      active = false
    }
  }, [])

  return defaults
}
