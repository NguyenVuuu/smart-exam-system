import { useCallback, useEffect, useState } from 'react'
import { getAdminExamTracking, getAdminQuestionBank, removeAdminQuestion, restoreAdminQuestion, type ContentListParams, type ExamTrackingParams } from '../api/admin-content.api'
import { toSharedQuestion, toTrackedExam } from '../mappers/admin-content.mapper'
import type { ApiPagination } from '../types/admin-api.types'

const emptyPagination: ApiPagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

export function useAdminQuestionBank(params: ContentListParams) {
  const { page, pageSize, keyword, departmentId, subjectId, status } = params
  const [state, setState] = useState({ items: [], pagination: emptyPagination, loading: true, error: null } as {
    items: ReturnType<typeof toSharedQuestion>[]; pagination: ApiPagination; loading: boolean; error: string | null
  })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    getAdminQuestionBank({ page, pageSize, keyword, departmentId, subjectId, status }).then((result) => active && setState({
      items: result.items.map(toSharedQuestion), pagination: result.pagination, loading: false, error: null,
    })).catch(() => active && setState((value) => ({ ...value, loading: false, error: 'Không thể tải ngân hàng câu hỏi chung.' })))
    return () => { active = false }
  }, [page, pageSize, keyword, departmentId, subjectId, status, version])
  const remove = useCallback(async (id: string, reason: string) => { await removeAdminQuestion(id, reason); setVersion((v) => v + 1) }, [])
  const restore = useCallback(async (id: string) => { await restoreAdminQuestion(id); setVersion((v) => v + 1) }, [])
  const retry = () => {
    setState((value) => ({ ...value, loading: true, error: null }))
    setVersion((value) => value + 1)
  }
  return { ...state, remove, restore, retry }
}

export function useAdminExamTracking(params: ExamTrackingParams) {
  const {
    page, pageSize, keyword, departmentId, subjectId,
    semesterId, status, type, approvalStatus,
  } = params
  const [state, setState] = useState({ items: [], pagination: emptyPagination, loading: true, error: null } as {
    items: ReturnType<typeof toTrackedExam>[]; pagination: ApiPagination; loading: boolean; error: string | null
  })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    getAdminExamTracking({
      page, pageSize, keyword, departmentId, subjectId,
      semesterId, status, type, approvalStatus,
    }).then((result) => active && setState({
      items: result.items.map(toTrackedExam), pagination: result.pagination, loading: false, error: null,
    })).catch(() => active && setState((value) => ({ ...value, loading: false, error: 'Không thể tải danh sách đề thi.' })))
    return () => { active = false }
  }, [page, pageSize, keyword, departmentId, subjectId, semesterId, status, type, approvalStatus, version])
  const retry = () => {
    setState((value) => ({ ...value, loading: true, error: null }))
    setVersion((value) => value + 1)
  }
  return { ...state, retry }
}
