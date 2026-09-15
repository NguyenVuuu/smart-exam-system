import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTeacherProctorAssignments, type ProctorAssignmentQuery } from '../api/teacher-courses.api'
import type { TeacherPage } from '../types/teacher-course-api.types'

const defaultQuery: ProctorAssignmentQuery = { page: 1, pageSize: 100 }
const emptyPagination: TeacherPage<never>['pagination'] = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 1,
}

export function useTeacherProctorAssignments(query: ProctorAssignmentQuery = defaultQuery) {
  const assignmentsQuery = useQuery({
    queryKey: ['teacher-proctor-assignments', query],
    queryFn: () => getTeacherProctorAssignments(query),
    placeholderData: keepPreviousData,
  })

  return {
    assignments: assignmentsQuery.data?.items ?? [],
    pagination: assignmentsQuery.data?.pagination ?? emptyPagination,
    loading: assignmentsQuery.isPending || assignmentsQuery.isFetching,
    error: assignmentsQuery.isError ? 'Không thể tải lịch coi thi được phân công.' : null,
    retry: assignmentsQuery.refetch,
  }
}
