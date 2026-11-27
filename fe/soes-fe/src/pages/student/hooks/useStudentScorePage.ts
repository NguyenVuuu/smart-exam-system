import { useEffect, useState } from 'react'
import { getStudentScores } from '../api/student-portal.api'
import { getStudentSubjects } from '../api/student-subjects.api'

export const SCORE_PAGE_SIZE = 10

export function useStudentScorePage() {
  const [subjectsData, setSubjectsData] = useState<Awaited<ReturnType<typeof getStudentSubjects>> | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<typeof getStudentScores>> | null>(null)
  const [semester, setSemester] = useState('')
  const [selectedCourseOfferingId, setCourse] = useState('ALL')
  const [keyword, setSearch] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [subjectLoading, setSubjectLoading] = useState(true)
  const [scoreLoading, setScoreLoading] = useState(true)
  const [subjectError, setSubjectError] = useState(false)
  const [scoreError, setScoreError] = useState(false)
  const selectedSemesterId = semester || subjectsData?.currentSemesterId
    || subjectsData?.semesterOptions.find(item => item.isCurrent)?.id || subjectsData?.semesterOptions[0]?.id || ''
  const subjectsReady = subjectsData !== null

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword), 250)
    return () => window.clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setSubjectLoading(true)
      setSubjectError(false)
      try {
        const result = await getStudentSubjects({ page: 1, pageSize: 100, semesterId: semester || undefined })
        if (!cancelled) setSubjectsData(result)
      } catch { if (!cancelled) setSubjectError(true) }
      finally { if (!cancelled) setSubjectLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [semester, revision])

  useEffect(() => {
    if (!subjectsReady || keyword !== debouncedKeyword) return
    let cancelled = false
    async function load() {
      setScoreLoading(true)
      setScoreError(false)
      try {
        const result = await getStudentScores({
          page, pageSize: SCORE_PAGE_SIZE, semesterId: selectedSemesterId || undefined,
          courseOfferingId: selectedCourseOfferingId === 'ALL' ? undefined : selectedCourseOfferingId,
          keyword: debouncedKeyword || undefined,
        })
        if (!cancelled) {
          setData(result)
          if (result.pagination && page > result.pagination.totalPages) setPage(result.pagination.totalPages)
        }
      } catch { if (!cancelled) setScoreError(true) }
      finally { if (!cancelled) setScoreLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [subjectsReady, selectedSemesterId, selectedCourseOfferingId, page, keyword, debouncedKeyword, revision])

  function setKeyword(value: string) { setSearch(value); setPage(1) }
  function setSelectedCourseOfferingId(value: string) { setCourse(value); setPage(1) }
  function handleSemesterChange(value: string) {
    setSemester(value); setCourse('ALL'); setSearch(''); setPage(1)
  }
  return {
    scores: data?.items ?? [], subjects: subjectsData?.items ?? [],
    semesterOptions: subjectsData?.semesterOptions ?? [], selectedSemesterId,
    selectedCourseOfferingId, setSelectedCourseOfferingId, keyword, setKeyword, page, setPage,
    totalItems: data?.pagination?.totalItems ?? 0, totalPages: data?.pagination?.totalPages ?? 1,
    averageScore: data?.averageScore ?? null, highestScore: data?.highestScore ?? null,
    loading: subjectLoading || (subjectsReady && scoreLoading) || keyword !== debouncedKeyword,
    error: subjectError || scoreError ? 'Không thể tải điểm số.' : null,
    handleSemesterChange, load: () => setRevision(value => value + 1),
  }
}
