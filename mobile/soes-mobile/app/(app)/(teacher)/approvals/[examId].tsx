import { useLocalSearchParams } from 'expo-router'
import { TeacherApprovalDetailPage } from '../../../../src/pages/teacher/TeacherApprovalDetailPage'

export default function ApprovalDetailRoute() {
  const { examId } = useLocalSearchParams<{ examId: string }>()
  return <TeacherApprovalDetailPage id={examId} />
}
