import { useState } from 'react'
import { SCORE_DATA, SEMESTER_OPTIONS, SCORE_TYPE_OPTIONS } from '../mock/dashboard.mock'
import type { ScoreEntry } from '../types/dashboard.types'

export function useDashboardAnalytics() {
  const [selectedSemester, setSelectedSemester] = useState(SEMESTER_OPTIONS[0].value)
  const [selectedScoreType, setSelectedScoreType] = useState(SCORE_TYPE_OPTIONS[0].value)

  const data: ScoreEntry[] =
    SCORE_DATA[selectedSemester]?.[selectedScoreType] ?? []

  return {
    semesterOptions: SEMESTER_OPTIONS,
    scoreTypeOptions: SCORE_TYPE_OPTIONS,
    data,
    selectedSemester,
    selectedScoreType,
    onSemesterChange: setSelectedSemester,
    onScoreTypeChange: setSelectedScoreType,
  }
}
