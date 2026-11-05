import { useLocalSearchParams } from 'expo-router'
import { CourseDetailScreen } from '../../../../src/pages/teacher/CourseDetailPage'

export default function CourseDetailRoute() {
  const { courseOfferingId } = useLocalSearchParams<{ courseOfferingId: string }>()
  return <CourseDetailScreen id={courseOfferingId} />
}
