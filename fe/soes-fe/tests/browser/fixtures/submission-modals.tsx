import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ReasonModal } from '../../../src/pages/teacher/components/exam-detail/SubmissionReasonModal'
import { BulkReasonsModal } from '../../../src/pages/teacher/components/exam-detail/BulkSubmissionReasonsModal'
import type { ExamSubmission } from '../../../src/pages/teacher/types/teacher-exam.types'
import type { ChangedItem } from '../../../src/pages/teacher/components/exam-detail/score-adjustment-options'

const submission: ExamSubmission = {
  id: 'one', examId: 'exam', scheduleId: 'schedule', attemptId: 'attempt', studentId: 'student',
  studentCode: 'Fixture', studentName: 'Fixture Student', submittedAt: '2026-11-26T00:00:00Z',
  hasSubmitted: true, autoScore: 5, finalScore: null, violationCount: 0, violationsViewed: true,
  isMakeup: false, status: 'GRADED', endedBy: 'STUDENT', proctorActionReason: null,
}

function Fixture() {
  const [result, setResult] = useState<unknown>(null)
  const item: ChangedItem = { submission, score: 6, reason: '', adjustmentType: 'OTHER', evidenceUrls: [], violationIds: [] }
  const bulk = new URLSearchParams(location.search).has('bulk')
  return <>
    {bulk ? <BulkReasonsModal initialItems={[item]} totalPending={1} saving={false}
      violationsByStudentId={{}} onConfirm={setResult} onClose={() => setResult('closed')} />
      : <ReasonModal submission={submission} score={6} saving={false} violationEvidences={[]}
        onConfirm={(reason, type, evidenceUrls, violationIds) => setResult({ reason, type, evidenceUrls, violationIds })}
        onClose={() => setResult('closed')} />}
    <output aria-label="result">{JSON.stringify(result)}</output>
  </>
}

const root = document.getElementById('root')
if (!root) throw new Error('Fixture root is missing')
createRoot(root).render(<Fixture />)
