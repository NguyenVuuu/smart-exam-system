import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  SaveAnswerPayload,
  StartExamRequest,
} from '../../api/student-take-exam.api'
import { takeExamApi } from '../../api/student-take-exam.api'

export const takeExamQueryKeys = {
  all: ['student-take-exam'] as const,
  attempt: (scheduleId: string, attemptId: string) => [...takeExamQueryKeys.all, scheduleId, attemptId] as const,
  status: (scheduleId: string, attemptId: string) => [...takeExamQueryKeys.all, scheduleId, attemptId, 'status'] as const,
}

export function useStartExamMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data?: StartExamRequest }) =>
      takeExamApi.startExam(scheduleId, data),
  })
}

export function useGetExamAttempt(scheduleId: string, attemptId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: takeExamQueryKeys.attempt(scheduleId, attemptId),
    queryFn: () => takeExamApi.getExamAttempt(scheduleId, attemptId),
    enabled: enabled && !!scheduleId && !!attemptId,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // The attempt data should rarely change from the backend unless refetched
  })
}

export function useSaveAnswerMutation() {
  return useMutation({
    mutationFn: ({
      scheduleId,
      attemptId,
      data,
    }: {
      scheduleId: string
      attemptId: string
      data: SaveAnswerPayload[]
    }) => takeExamApi.saveAnswers(scheduleId, attemptId, data),
  })
}

export function useSubmitExamMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, attemptId }: { scheduleId: string; attemptId: string }) =>
      takeExamApi.submitExam(scheduleId, attemptId),
  })
}

export function useSendHeartbeatMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, attemptId }: { scheduleId: string; attemptId: string }) =>
      takeExamApi.sendHeartbeat(scheduleId, attemptId),
  })
}

export function useGetExamAttemptStatus(scheduleId: string, attemptId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: takeExamQueryKeys.status(scheduleId, attemptId),
    queryFn: () => takeExamApi.getAttemptStatus(scheduleId, attemptId),
    enabled: enabled && !!scheduleId && !!attemptId,
    refetchOnWindowFocus: false,
  })
}

export function useRunCodeMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, attemptId, questionId, sourceCode }: {
      scheduleId: string
      attemptId: string
      questionId: string
      sourceCode: string
    }) => takeExamApi.runCode(scheduleId, attemptId, questionId, sourceCode),
  })
}
