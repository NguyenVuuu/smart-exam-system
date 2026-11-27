import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../src/store/authStore'
import { useCourseHeader } from '../../../src/pages/student/hooks/course-detail/useCourseHeader'
import { useMembers } from '../../../src/pages/student/hooks/course-detail/useMembers'
import { useTimeline } from '../../../src/pages/student/hooks/course-detail/useTimeline'
import { useScores } from '../../../src/pages/student/hooks/course-detail/useScores'
import { usePostDetail } from '../../../src/pages/student/hooks/course-detail/usePostDetail'
import { useExamDetail } from '../../../src/pages/student/hooks/exam-detail/useExamDetail'
import { useStudentSubjects } from '../../../src/pages/student/hooks/useStudentSubjects'
import { useAdminSemesters } from '../../../src/pages/admin/hooks/useAdminSemesters'
import { useStudentGradeAppeals } from '../../../src/pages/student/hooks/useStudentGradeAppeals'
import SystemLogoField from '../../../src/pages/admin/components/settings/SystemLogoField'
import AdminSidebar from '../../../src/pages/admin/components/AdminSidebar'
import FaceVerification from '../../../src/pages/student/components/face/FaceVerification'

useAuthStore.getState().setUser({ id: 'owner-a', profileId: 'profile', fullName: 'Fixture', email: null,
  avatarUrl: null, role: 'ADMIN', studentCode: null, adminCode: 'fixture', teacherCode: null,
  permissions: ['USERS_VIEW', 'SETTINGS_VIEW'] })
const client = new QueryClient()

function CoursePanel() {
  const [course, setCourse] = useState('one')
  const header = useCourseHeader(course)
  const members = useMembers(course)
  const timeline = useTimeline(course)
  const scores = useScores(course)
  const post = usePostDetail(course, 'post')
  const exam = useExamDetail(course, 'exam')
  return <>
    <button onClick={() => setCourse('two')}>Change course</button>
    <button onClick={() => { const user = useAuthStore.getState().user!; useAuthStore.getState().setUser({ ...user, id: 'owner-b' }) }}>Change owner</button>
    <button onClick={() => members.setPage(2)}>Member page 2</button>
    <button onClick={() => timeline.setPage(2)}>Timeline page 2</button>
    <output aria-label="header">{header.data?.subjectName ?? 'loading'}</output>
    <output aria-label="members">{JSON.stringify(members.items)}</output>
    <output aria-label="timeline">{JSON.stringify(timeline.items)}</output>
    <output aria-label="scores">{JSON.stringify(scores.items)}</output>
    <output aria-label="post">{JSON.stringify(post.data)}</output>
    <output aria-label="exam">{JSON.stringify(exam.data)}</output>
  </>
}

function SubjectsPanel() {
  const query = useStudentSubjects()
  return <>
    <input aria-label="search" value={query.keyword} onChange={event => query.setKeyword(event.target.value)} />
    <button onClick={() => query.setPage(2)}>Page 2</button>
    <button onClick={() => query.onSemesterChange('semester-two')}>Change semester</button>
    <button onClick={() => void query.retry()}>Retry</button>
    <output aria-label="subjects">{JSON.stringify(query.items)}</output>
    <output aria-label="error">{query.error}</output>
  </>
}

function SemestersPanel() {
  const query = useAdminSemesters()
  return <>
    <button onClick={() => void query.create({ academicYear: '2026-2027', term: 'TERM_2', startDate: '2027-01-01', endDate: '2027-06-01' })}>Create semester</button>
    <button onClick={() => void query.activate('second')}>Activate second</button>
    <output aria-label="semesters">{JSON.stringify(query.items)}</output>
  </>
}

function AppealsPanel() {
  const query = useStudentGradeAppeals('schedule', 'attempt')
  return <>
    <input aria-label="reason" value={query.reason} onChange={event => query.setReason(event.target.value)} />
    <button onClick={() => void query.submit()}>Submit appeal</button>
    <output aria-label="appeals">{JSON.stringify(query.appeals)}</output>
  </>
}

function AppearancePanel() {
  const [file, setFile] = useState<File | null>(null)
  const [schedule, setSchedule] = useState('one')
  const navigate = useNavigate()
  return <>
    <AdminSidebar />
    <button onClick={() => navigate('/admin/settings')}>Settings route</button>
    <button onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}>Toggle sidebar</button>
    <button onClick={() => setSchedule('two')}>Change face scope</button>
    <FaceVerification purpose="EXAM_ENTRY" scheduleId={schedule} onPassed={() => undefined} />
    <SystemLogoField savedLogoUrl="/saved-logo.png" selectedFile={file} isRemoved={false}
      onFileSelect={setFile} onRemoveLogo={() => setFile(null)} onRevertLogo={() => setFile(null)} />
  </>
}

export function Fixture() {
  const mode = new URLSearchParams(location.search).get('mode')
  return mode === 'subjects' ? <SubjectsPanel /> : mode === 'semesters' ? <SemestersPanel />
    : mode === 'appeals' ? <AppealsPanel /> : mode === 'appearance' ? <AppearancePanel /> : <CoursePanel />
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin/users']}><Fixture /></MemoryRouter></QueryClientProvider>)
