import { createContext, useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { getStudentFaceProfile } from '../api/student-face.api'

type EnrollmentState = 'loading' | 'required' | 'ready' | 'error'

export const StudentFaceEnrollmentContext = createContext<{ refresh: () => Promise<void> } | null>(null)

export function useStudentFaceEnrollment(active: boolean) {
  const [state, setState] = useState<EnrollmentState>('loading')

  const refresh = useCallback(async () => {
    if (!active) return
    try {
      const profile = await getStudentFaceProfile()
      setState(profile.enabled && !profile.enrolled ? 'required' : 'ready')
    } catch {
      setState('error')
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    void getStudentFaceProfile()
      .then((profile) => setState(profile.enabled && !profile.enrolled ? 'required' : 'ready'))
      .catch(() => setState('error'))
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh()
    })
    return () => subscription.remove()
  }, [active, refresh])

  return { state, refresh }
}
