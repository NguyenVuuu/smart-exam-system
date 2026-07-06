import { useMemo, useState } from 'react'
import type { AnalyticsItem, ExamType, ScoreEntry, SelectOption } from '../types/dashboard.types'

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  QUIZ: 'Thường kỳ',
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
}

const SCORE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all',     label: 'Tất cả'     },
  { value: 'QUIZ',    label: 'Thường kỳ'  },
  { value: 'MIDTERM', label: 'Giữa kỳ'   },
  { value: 'FINAL',   label: 'Cuối kỳ'   },
]

export function useDashboardAnalytics(analyticsItems: AnalyticsItem[]) {
  const semesterOptions = useMemo<SelectOption[]>(() => {
    const seen = new Map<string, string>()
    for (const item of analyticsItems) {
      if (!seen.has(item.semesterId)) seen.set(item.semesterId, item.semesterName)
    }
    const opts: SelectOption[] = Array.from(seen.entries()).map(([value, label]) => ({ value, label }))
    if (opts.length > 1) opts.unshift({ value: 'all', label: 'Tất cả HK' })
    return opts
  }, [analyticsItems])

  const [selectedSemester, setSelectedSemester] = useState<string>('')
  const [selectedScoreType, setSelectedScoreType] = useState<string>('all')

  const effectiveSemester = useMemo(() => {
    if (selectedSemester) return selectedSemester
    const first = semesterOptions.find((o) => o.value !== 'all')
    return first?.value ?? ''
  }, [selectedSemester, semesterOptions])

  const filteredData = useMemo<ScoreEntry[]>(() => {
    let items = analyticsItems

    if (effectiveSemester && effectiveSemester !== 'all') {
      items = items.filter((item) => item.semesterId === effectiveSemester)
    }

    if (selectedScoreType !== 'all') {
      items = items.filter((item) => item.examType === selectedScoreType)
    }

    // When showing all types, append exam type to subject label for clarity
    return items.map((item) => ({
      subject:
        selectedScoreType === 'all'
          ? `${item.subjectName}\n(${EXAM_TYPE_LABELS[item.examType] ?? item.examType})`
          : item.subjectName,
      studentScore: item.myScore,
      classAverage: item.classAverage,
    }))
  }, [analyticsItems, effectiveSemester, selectedScoreType])

  return {
    semesterOptions,
    scoreTypeOptions: SCORE_TYPE_OPTIONS,
    data: filteredData,
    selectedSemester: effectiveSemester,
    selectedScoreType,
    onSemesterChange: setSelectedSemester,
    onScoreTypeChange: setSelectedScoreType,
  }
}
