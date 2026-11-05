import { useLocalSearchParams } from 'expo-router'
import { TeacherExamDetailPage } from '../../../../src/pages/teacher/TeacherExamDetailPage'

export default function ExamDetailRoute() {
  const { examId } = useLocalSearchParams<{ examId: string }>()
  return <TeacherExamDetailPage id={examId} />
}
