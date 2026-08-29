import { useCallback, useEffect, useState } from 'react'
import { getAdminExamTracking, getAdminQuestionBank, removeAdminQuestion, restoreAdminQuestion, type ContentListParams, type ExamTrackingParams } from '../api/admin-content.api'
import { toSharedQuestion, toTrackedExam } from '../mappers/admin-content.mapper'
import type { ApiPagination } from '../types/admin-api.types'

const emptyPagination: ApiPagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

export function useAdminQuestionBank(params: ContentListParams) {
  const [state, setState] = useState({ items: [], pagination: emptyPagination, loading: true, error: null } as {
    items: ReturnType<typeof toSharedQuestion>[]; pagination: ApiPagination; loading: boolean; error: string | null
  })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setState((value) => ({ ...value, loading: true, error: null }))
    getAdminQuestionBank(params).then((page) => active && setState({
      items: page.items.map(toSharedQuestion), pagination: page.pagination, loading: false, error: null,
    })).catch(() => active && setState((value) => ({ ...value, loading: false, error: 'Không thể tải ngân hàng câu hỏi chung.' })))
    return () => { active = false }
  }, [params.page, params.pageSize, params.keyword, params.departmentId, params.subjectId, params.status, version])
  const remove = useCallback(async (id: string, reason: string) => { await removeAdminQuestion(id, reason); setVersion((v) => v + 1) }, [])
  const restore = useCallback(async (id: string) => { await restoreAdminQuestion(id); setVersion((v) => v + 1) }, [])
  return { ...state, remove, restore, retry: () => setVersion((v) => v + 1) }
}

export function useAdminExamTracking(params: ExamTrackingParams) {
  const [state, setState] = useState({ items: [], pagination: emptyPagination, loading: true, error: null } as {
    items: ReturnType<typeof toTrackedExam>[]; pagination: ApiPagination; loading: boolean; error: string | null
  })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setState((value) => ({ ...value, loading: true, error: null }))
    getAdminExamTracking(params).then((page) => active && setState({
      items: page.items.map(toTrackedExam), pagination: page.pagination, loading: false, error: null,
    })).catch(() => active && setState((value) => ({ ...value, loading: false, error: 'Không thể tải danh sách đề thi.' })))
    return () => { active = false }
  }, [params.page, params.pageSize, params.keyword, params.departmentId, params.subjectId, params.status, params.type, params.approvalStatus, version])
  return { ...state, retry: () => setVersion((v) => v + 1) }
}
