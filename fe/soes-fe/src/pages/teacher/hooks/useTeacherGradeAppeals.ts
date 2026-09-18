import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../../api/socket'
import {
  getTeacherGradeAppeals,
  updateTeacherGradeAppeal,
  type TeacherGradeAppeal,
  type TeacherPaginationMeta,
} from '../api/teacher-exams.api'

export type GradeAppealStatus = TeacherGradeAppeal['status'] | 'ALL'

const EMPTY_PAGINATION: TeacherPaginationMeta = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
}

export function useTeacherGradeAppeals() {
  const [appeals, setAppeals] = useState<TeacherGradeAppeal[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [pagination, setPagination] = useState(EMPTY_PAGINATION)
  const [status, setStatus] = useState<GradeAppealStatus>('ALL')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loadedQueryKey, setLoadedQueryKey] = useState('')

  const queryKey = `${status}:${pagination.page}:${refreshVersion}`

  useEffect(() => {
    let active = true
    getTeacherGradeAppeals({ status, page: pagination.page, pageSize: 10 })
      .then((response) => {
        if (!active) return
        setAppeals(response.items)
        setOpenCount(response.openCount)
        setPagination(response.pagination)
        setLoadedQueryKey(queryKey)
      })
      .catch(() => {
        if (!active) return
        setLoadedQueryKey(queryKey)
        toast.error('Không thể tải danh sách phúc khảo.')
      })
    return () => { active = false }
  }, [pagination.page, queryKey, status])

  useEffect(() => {
    const socket = getSocket()
    const refreshAppeals = () => {
      setPagination((current) => ({ ...current, page: 1 }))
      setRefreshVersion((current) => current + 1)
    }
    socket.on('grade_appeal:created', refreshAppeals)
    return () => { socket.off('grade_appeal:created', refreshAppeals) }
  }, [])

  const changeStatus = (nextStatus: GradeAppealStatus) => {
    setStatus(nextStatus)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const updateReply = (appealId: string, reply: string) => {
    setReplies((current) => ({ ...current, [appealId]: reply }))
  }

  const updateAppeal = async (appealId: string, nextStatus: 'IN_REVIEW' | 'REJECTED') => {
    try {
      const updated = await updateTeacherGradeAppeal(appealId, {
        status: nextStatus,
        teacherReply: replies[appealId]?.trim() || undefined,
      })
      setAppeals((current) => current.map((appeal) => appeal.id === appealId ? updated : appeal))
      setRefreshVersion((current) => current + 1)
      toast.success('Đã cập nhật yêu cầu phúc khảo.')
    } catch {
      toast.error('Không thể cập nhật yêu cầu phúc khảo.')
    }
  }

  return {
    appeals, openCount, pagination, status, replies,
    loading: loadedQueryKey !== queryKey,
    setPage: (page: number) => setPagination((current) => ({ ...current, page })),
    refresh: () => setRefreshVersion((current) => current + 1),
    changeStatus, updateReply, updateAppeal,
  }
}
