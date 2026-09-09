import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/teacher-questions.api'
import { toQuestionPayload } from '../mappers/teacher-question.mapper'
import type { Question } from '../types/teacher-question-bank.types'

const auditQueryKey = ['teacher', 'question-audit'] as const

export const useQuestionAudit = (filters: api.QuestionAuditFilters) => {
  const queryClient = useQueryClient()
  const audit = useQuery({
    queryKey: [...auditQueryKey, filters],
    queryFn: () => api.getQuestionAudit(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
  const subjects = useQuery({
    queryKey: ['teacher', 'question-subjects'],
    queryFn: api.getQuestionSubjects,
  })
  const updateQuestion = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Question> }) =>
      api.updateQuestion(id, toQuestionPayload(updates)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auditQueryKey }),
  })

  return { audit, subjects, updateQuestion }
}
