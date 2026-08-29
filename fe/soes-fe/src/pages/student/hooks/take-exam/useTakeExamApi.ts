import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  SaveAnswerPayload,
  StartExamRequest,
} from '../../api/student-take-exam.api'
import { takeExamApi } from '../../api/student-take-exam.api'

export const takeExamQueryKeys = {
  all: ['student-take-exam'] as const,
  attempt: (examId: string, attemptId: string) => [...takeExamQueryKeys.all, examId, attemptId] as const,
  status: (examId: string, attemptId: string) => [...takeExamQueryKeys.all, examId, attemptId, 'status'] as const,
}

export function useStartExamMutation() {
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data?: StartExamRequest }) =>
      takeExamApi.startExam(examId, data),
  })
}

export function useGetExamAttempt(examId: string, attemptId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: takeExamQueryKeys.attempt(examId, attemptId),
    queryFn: () => takeExamApi.getExamAttempt(examId, attemptId),
    enabled: enabled && !!examId && !!attemptId,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // The attempt data should rarely change from the backend unless refetched
  })
}

export function useSaveAnswerMutation() {
  return useMutation({
    mutationFn: ({
      examId,
      attemptId,
      data,
    }: {
      examId: string
      attemptId: string
      data: SaveAnswerPayload[]
    }) => takeExamApi.saveAnswers(examId, attemptId, data),
  })
}

export function useSubmitExamMutation() {
  return useMutation({
    mutationFn: ({ examId, attemptId }: { examId: string; attemptId: string }) =>
      takeExamApi.submitExam(examId, attemptId),
  })
}

export function useSendHeartbeatMutation() {
  return useMutation({
    mutationFn: ({ examId, attemptId }: { examId: string; attemptId: string }) =>
      takeExamApi.sendHeartbeat(examId, attemptId),
  })
}

export function useGetExamAttemptStatus(examId: string, attemptId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: takeExamQueryKeys.status(examId, attemptId),
    queryFn: () => takeExamApi.getAttemptStatus(examId, attemptId),
    enabled: enabled && !!examId && !!attemptId,
    refetchOnWindowFocus: false,
  })
}

export function useRunCodeMutation() {
  return useMutation({
    mutationFn: ({ examId, attemptId, questionId, sourceCode }: {
      examId: string
      attemptId: string
      questionId: string
      sourceCode: string
    }) => takeExamApi.runCode(examId, attemptId, questionId, sourceCode),
  })
}
