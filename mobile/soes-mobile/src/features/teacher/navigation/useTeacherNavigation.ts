import { useMemo } from 'react'
import { teacherNavigation } from '../../../navigation/teacher-navigation'
import { useReviewGroupAccess } from './useReviewGroupAccess'

const reviewKeys = new Set(['approvals', 'question-approvals'])

export function useTeacherNavigation(enabled: boolean) {
  const { access, loading } = useReviewGroupAccess(enabled)
  const groups = useMemo(() => teacherNavigation.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.key === 'review-group') return access?.canViewGroup === true
      if (reviewKeys.has(item.key)) return access?.canReview === true
      return true
    }),
  })).filter((group) => group.items.length > 0), [access])

  return { groups, access, loading }
}
