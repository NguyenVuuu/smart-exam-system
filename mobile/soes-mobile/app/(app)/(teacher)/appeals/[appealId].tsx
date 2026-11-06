import { useLocalSearchParams } from 'expo-router'
import { TeacherAppealDetailPage } from '../../../../src/pages/teacher/TeacherAppealDetailPage'

export default function AppealDetailRoute() {
  const { appealId } = useLocalSearchParams<{ appealId: string }>()
  return <TeacherAppealDetailPage id={appealId} />
}
