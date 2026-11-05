import { useLocalSearchParams } from 'expo-router'
import { CourseDetailScreen } from '../../../../src/features/teacher/courses/CourseDetailScreen'

export default function CourseDetailRoute() {
  const { courseOfferingId } = useLocalSearchParams<{ courseOfferingId: string }>()
  return <CourseDetailScreen id={courseOfferingId} />
}
