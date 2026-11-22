import { useLocalSearchParams } from 'expo-router'
import { TeacherProctoringPage } from '../../../../src/pages/teacher/TeacherProctoringPage'

export default function TeacherProctoringRoute() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>()
  return <TeacherProctoringPage scheduleId={scheduleId ?? ''} />
}
