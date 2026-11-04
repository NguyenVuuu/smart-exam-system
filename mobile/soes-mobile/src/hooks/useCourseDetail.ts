import { useEffect, useRef, useState } from 'react'
import {
  getCourseHeader, getTimeline, getMembers, getScores, getMaterials,
} from '../api/student-course-detail.api'
import type {
  CourseHeader, TimelineItem, Member, ScoreItem, CourseMaterial, Pagination,
} from '../types/course-detail.types'

const INIT_PAGINATION: Pagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }

// ── Course Header ────────────────────────────────────────────────────────────
export function useCourseHeader(id: string) {
  const [data, setData] = useState<CourseHeader | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!id) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getCourseHeader(id)
      .then(d => { if (cid === ref.current) { setData(d); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải thông tin môn học.'); setIsLoading(false) } })
  }, [id])
  return { data, isLoading, error }
}

// ── Timeline ─────────────────────────────────────────────────────────────────
export function useTimeline(id: string) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [pagination, setPagination] = useState<Pagination>(INIT_PAGINATION)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!id) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getTimeline(id, { page, pageSize: 10 })
      .then(d => { if (cid === ref.current) { setItems(d.items); setPagination(d.pagination); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải bài đăng.'); setIsLoading(false) } })
  }, [id, page])
  return { items, pagination, page, setPage, isLoading, error }
}

// ── Members ───────────────────────────────────────────────────────────────────
export function useMembers(id: string) {
  const [items, setItems] = useState<Member[]>([])
  const [pagination, setPagination] = useState<Pagination>(INIT_PAGINATION)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!id) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getMembers(id, { page, pageSize: 20 })
      .then(d => { if (cid === ref.current) { setItems(d.items); setPagination(d.pagination); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải thành viên.'); setIsLoading(false) } })
  }, [id, page])
  return { items, pagination, page, setPage, isLoading, error }
}

// ── Scores ────────────────────────────────────────────────────────────────────
export function useScores(id: string) {
  const [items, setItems] = useState<ScoreItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!id) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getScores(id)
      .then(d => { if (cid === ref.current) { setItems(d.items); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải điểm số.'); setIsLoading(false) } })
  }, [id])
  return { items, isLoading, error }
}

// ── Materials ─────────────────────────────────────────────────────────────────
export function useMaterials(id: string) {
  const [items, setItems] = useState<CourseMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  const load = () => {
    if (!id) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getMaterials(id)
      .then(d => { if (cid === ref.current) { setItems(d.items); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải tài liệu.'); setIsLoading(false) } })
  }
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return { items, isLoading, error, reload: load }
}

// ── Exam Detail ───────────────────────────────────────────────────────────────
import { getExamDetail } from '../api/student-course-detail.api'
import type { ExamDetail } from '../types/course-detail.types'

export function useExamDetail(courseOfferingId: string, scheduleId: string) {
  const [data, setData] = useState<ExamDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!courseOfferingId || !scheduleId) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getExamDetail(courseOfferingId, scheduleId)
      .then(d => { if (cid === ref.current) { setData(d); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải thông tin bài thi.'); setIsLoading(false) } })
  }, [courseOfferingId, scheduleId])
  return { data, isLoading, error }
}

// ── Post Detail ───────────────────────────────────────────────────────────────
import { getPostDetail } from '../api/student-course-detail.api'
import type { PostDetail } from '../types/course-detail.types'

export function usePostDetail(courseOfferingId: string, postId: string) {
  const [data, setData] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(0)
  useEffect(() => {
    if (!courseOfferingId || !postId) return
    const cid = ++ref.current
    setIsLoading(true); setError(null)
    getPostDetail(courseOfferingId, postId)
      .then(d => { if (cid === ref.current) { setData(d); setIsLoading(false) } })
      .catch(() => { if (cid === ref.current) { setError('Không thể tải bài đăng.'); setIsLoading(false) } })
  }, [courseOfferingId, postId])
  return { data, isLoading, error }
}
