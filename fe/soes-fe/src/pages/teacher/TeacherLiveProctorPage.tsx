import { AlertTriangle, RefreshCw, ShieldAlert, Video } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import AppSelect from '../../components/common/AppSelect'
import { formatDateTime } from '../../utils/date.utils'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import { ExamDetailBackButton } from './components/exam-detail/ExamDetailBackButton'
import EvidenceImageModal from './components/proctoring/EvidenceImageModal'
import ExtendTimeModal from './components/proctoring/ExtendTimeModal'
import LiveStreamPanel from './components/proctoring/LiveStreamPanel'
import ProctoringAssignmentPicker from './components/proctoring/ProctoringAssignmentPicker'
import ProctoringMetrics from './components/proctoring/ProctoringMetrics'
import StudentLiveTable from './components/proctoring/StudentLiveTable'
import ViolationLogTable from './components/proctoring/ViolationLogTable'
import { violationTypeLabels } from './components/proctoring/violationLog.constants'
import { useTeacherProctorAssignments } from './hooks/useTeacherProctorAssignments'
import { useLiveProctorSocket } from './hooks/useLiveProctorSocket'
import {
  extendTeacherAttemptTime,
  getTeacherLiveProctoringSessions,
  getTeacherLiveProctoringViolations,
} from './api/teacher-exams.api'
import type { ProctoringSessionRecord, ViolationRecord } from './types/teacher-exam.types'
import type { TeacherPaginationMeta } from './api/teacher-exams.api'
import type { ProctorAssignmentApiDto } from './types/teacher-course-api.types'

type ProctoringTab = 'live' | 'violations'

const REFRESH_MS = 10_000
const ASSIGNMENT_PAGE_SIZE = 10
const VIOLATION_PAGE_SIZE = 10
const emptyViolationPagination: TeacherPaginationMeta = {
  page: 1,
  pageSize: VIOLATION_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}

export default function TeacherLiveProctorPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const scheduleId = params.get('scheduleId') ?? ''
  const [assignmentPage, setAssignmentPage] = useState(1)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [debouncedAssignmentSearch] = useDebounce(assignmentSearch.trim(), 300)
  const assignmentQuery = useMemo(() => ({
    page: assignmentPage,
    pageSize: ASSIGNMENT_PAGE_SIZE,
    keyword: debouncedAssignmentSearch || undefined,
    status: 'OPEN' as const,
  }), [assignmentPage, debouncedAssignmentSearch])
  const assignmentsData = useTeacherProctorAssignments(assignmentQuery)

  const [activeTab, setActiveTab] = useState<ProctoringTab>(() => params.get('tab') === 'violations' ? 'violations' : 'live')
  const [sessions, setSessions] = useState<ProctoringSessionRecord[]>([])
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [scheduleTitle, setScheduleTitle] = useState('Ca thi')
  const [scheduleEnded, setScheduleEnded] = useState(() => params.get('scheduleStatus') === 'CLOSED')
  const [liveSearchQuery, setLiveSearchQuery] = useState('')
  const [violationSearchQuery, setViolationSearchQuery] = useState('')
  const [debouncedViolationSearch] = useDebounce(violationSearchQuery.trim(), 300)
  const [selectedViolationStudentId, setSelectedViolationStudentId] = useState('ALL')
  const [selectedViolationType, setSelectedViolationType] = useState<'ALL' | ViolationRecord['type']>('ALL')
  const [violationPage, setViolationPage] = useState(1)
  const [violationPagination, setViolationPagination] = useState<TeacherPaginationMeta>(emptyViolationPagination)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loadedRequestKey, setLoadedRequestKey] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)
  const [extensionTarget, setExtensionTarget] = useState<ProctoringSessionRecord | null>(null)
  const [isExtendingTime, setIsExtendingTime] = useState(false)

  const {
    liveAttemptId,
    liveStreamType,
    liveSessionId,
    liveStatus,
    remoteStream,
    videoRef,
    startLive,
    stopLive,
    captureManualLiveEvidence,
  } = useLiveProctorSocket({
    scheduleId,
    violationPage,
    debouncedViolationSearch,
    selectedViolationStudentId,
    selectedViolationType,
    setSessions,
    setViolations,
    setViolationPagination,
    setScheduleTitle,
    onSwitchToLiveTab: () => setActiveTab('live'),
  })

  const requestKey = [
    scheduleId,
    violationPage,
    debouncedViolationSearch,
    selectedViolationStudentId,
    selectedViolationType,
    refreshVersion,
  ].join(':')
  const loading = Boolean(scheduleId) && loadedRequestKey !== requestKey

  useEffect(() => {
    if (!scheduleId) return

    let active = true
    void Promise.all([
      getTeacherLiveProctoringSessions(scheduleId),
      getTeacherLiveProctoringViolations(scheduleId, {
        page: violationPage,
        pageSize: VIOLATION_PAGE_SIZE,
        keyword: debouncedViolationSearch || undefined,
        studentId: selectedViolationStudentId === 'ALL' ? undefined : selectedViolationStudentId,
        violationType: selectedViolationType === 'ALL' ? undefined : selectedViolationType,
      }),
    ]).then(([sessionData, violationItems]) => {
      if (!active) return
      const hasEnded = new Date(sessionData.schedule.endTime).getTime() <= Date.now()
      setScheduleTitle(sessionData.schedule.title)
      setScheduleEnded(hasEnded)
      if (hasEnded) setActiveTab('violations')
      setSessions(sessionData.items)
      setViolations(violationItems.items)
      setViolationPagination(violationItems.pagination)
      setLoadedRequestKey(requestKey)
    }).catch(() => {
      if (!active) return
      setLoadedRequestKey(requestKey)
      toast.error('Không thể tải dữ liệu giám sát ca thi.')
    })

    return () => {
      active = false
    }
  }, [debouncedViolationSearch, requestKey, scheduleId, selectedViolationStudentId, selectedViolationType, violationPage])

  useEffect(() => {
    if (!scheduleId) return
    const intervalId = window.setInterval(() => setRefreshVersion((current) => current + 1), REFRESH_MS)
    return () => window.clearInterval(intervalId)
  }, [scheduleId])

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const keyword = liveSearchQuery.trim().toLocaleLowerCase('vi')
    return !keyword ||
      session.studentName.toLocaleLowerCase('vi').includes(keyword) ||
      session.studentCode.toLocaleLowerCase('vi').includes(keyword)
  }), [liveSearchQuery, sessions])

  const violationStudentOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả sinh viên' },
    ...sessions
      .map((session) => ({
        value: session.studentId,
        label: `${session.studentCode} - ${session.studentName}`,
      }))
      .sort((first, second) => first.label.localeCompare(second.label, 'vi')),
  ], [sessions])

  const violationTypeOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả loại vi phạm' },
    ...Object.entries(violationTypeLabels)
      .map(([value, label]) => ({ value, label: label ?? value }))
      .sort((first, second) => first.label.localeCompare(second.label, 'vi')),
  ], [])

  const openProctoringAssignment = useCallback((assignment: ProctorAssignmentApiDto) => {
    const tab = assignment.status === 'CLOSED' ? 'violations' : 'live'
    setActiveTab(tab)
    setScheduleEnded(assignment.status === 'CLOSED')
    setViolationSearchQuery('')
    setSelectedViolationStudentId('ALL')
    setSelectedViolationType('ALL')
    setViolationPage(1)
    navigate(`/teacher/proctoring?scheduleId=${encodeURIComponent(assignment.scheduleId)}&courseOfferingId=${encodeURIComponent(assignment.courseOffering.id)}&tab=${tab}&scheduleStatus=${assignment.status}&from=proctoring`)
  }, [navigate])

  const extendAttemptTime = useCallback(async (extraMinutes: number, reason: string) => {
    if (!extensionTarget) return
    setIsExtendingTime(true)
    try {
      const result = await extendTeacherAttemptTime(extensionTarget.attemptId, extraMinutes, reason)
      toast.success(`Đã gia hạn ${result.extraMinutes} phút cho ${result.studentName}. Hạn mới: ${formatDateTime(result.newDeadline)}.`)
      setExtensionTarget(null)
      setRefreshVersion((current) => current + 1)
    } catch {
      toast.error('Không thể gia hạn thời gian làm bài.')
    } finally {
      setIsExtendingTime(false)
    }
  }, [extensionTarget])

  const liveStudent = sessions.find((session) => session.attemptId === liveAttemptId) ?? null
  const onlineCount = sessions.filter((session) => session.isOnline).length
  const cameraActiveCount = sessions.filter((session) => session.webcamStatus === 'ACTIVE').length
  const screenActiveCount = sessions.filter((session) => session.screenShareStatus === 'ACTIVE').length
  const totalViolationCount = sessions.reduce((total, session) => total + session.violationCount, 0)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          {scheduleId && (
            <ExamDetailBackButton
              onBack={() => navigate(params.get('from') === 'invigilation' ? '/teacher/invigilation-schedule' : '/teacher/proctoring')}
              label={params.get('from') === 'invigilation' ? 'Quay lại lịch coi thi' : 'Quay lại giám sát ca thi'}
            />
          )}
          <TeacherPageHeader
            title="Giám sát ca thi"
            description={scheduleId ? scheduleTitle : 'Chọn một ca thi từ lịch coi thi để mở phòng giám sát.'}
            icon={<ShieldAlert size={21} />}
            actions={
              <button
                type="button"
                onClick={() => {
                  if (scheduleId) setRefreshVersion((current) => current + 1)
                  else void assignmentsData.retry()
                }}
                disabled={scheduleId ? loading : assignmentsData.loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={15} /> Làm mới
              </button>
            }
          />

          {!scheduleId ? (
            <ProctoringAssignmentPicker
              assignments={assignmentsData.assignments}
              pagination={assignmentsData.pagination}
              searchQuery={assignmentSearch}
              loading={assignmentsData.loading}
              error={assignmentsData.error}
              onSearchChange={(query) => { setAssignmentSearch(query); setAssignmentPage(1) }}
              onPageChange={setAssignmentPage}
              onReset={() => { setAssignmentSearch(''); setAssignmentPage(1) }}
              onRetry={assignmentsData.retry}
              onOpen={openProctoringAssignment}
            />
          ) : (
            <>
              <ProctoringMetrics
                onlineCount={onlineCount}
                cameraActiveCount={cameraActiveCount}
                screenActiveCount={screenActiveCount}
                totalViolationCount={totalViolationCount}
              />

              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {!scheduleEnded && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'live' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Video size={16} /> Live proctoring
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('violations')}
                  className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'violations' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle size={16} /> Nhật ký vi phạm ({totalViolationCount})
                </button>
              </div>

              {activeTab === 'live' ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                  <TeacherTablePanel>
                    <TeacherToolbar
                      filters={<h3 className="text-sm font-semibold text-slate-950">Sinh viên đang làm bài</h3>}
                      searchValue={liveSearchQuery}
                      onSearchChange={setLiveSearchQuery}
                      searchPlaceholder="Tìm MSSV hoặc họ tên..."
                      onReset={() => setLiveSearchQuery('')}
                    />
                    <StudentLiveTable
                      sessions={filteredSessions}
                      liveAttemptId={liveAttemptId}
                      liveStreamType={liveStreamType}
                      onStartLive={startLive}
                      onStopLive={stopLive}
                      onExtendTime={setExtensionTarget}
                    />
                  </TeacherTablePanel>

                  <LiveStreamPanel
                    liveStudent={liveStudent}
                    liveStatus={liveStatus}
                    liveSessionId={liveSessionId}
                    liveStreamType={liveStreamType}
                    remoteStream={remoteStream}
                    videoRef={videoRef}
                    onCapture={captureManualLiveEvidence}
                  />
                </div>
              ) : (
                <TeacherTablePanel>
                  <TeacherToolbar
                    filters={
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                        <h3 className="text-sm font-semibold text-slate-950">Nhật ký bằng chứng vi phạm</h3>
                        <AppSelect
                          value={selectedViolationStudentId}
                          options={violationStudentOptions}
                          onChange={(value) => {
                            setSelectedViolationStudentId(value)
                            setViolationPage(1)
                          }}
                          disabled={violationStudentOptions.length <= 1}
                          placeholder="Lọc theo sinh viên"
                          className="w-full sm:w-72"
                          buttonClassName="rounded-lg"
                        />
                        <AppSelect
                          value={selectedViolationType}
                          options={violationTypeOptions}
                          onChange={(value) => {
                            setSelectedViolationType(value as 'ALL' | ViolationRecord['type'])
                            setViolationPage(1)
                          }}
                          placeholder="Lọc theo loại vi phạm"
                          className="w-full sm:w-64"
                          buttonClassName="rounded-lg"
                        />
                      </div>
                    }
                    searchValue={violationSearchQuery}
                    onSearchChange={(value) => {
                      setViolationSearchQuery(value)
                      setViolationPage(1)
                    }}
                    searchPlaceholder="Tìm MSSV hoặc họ tên..."
                    onReset={() => {
                      setViolationSearchQuery('')
                      setSelectedViolationStudentId('ALL')
                      setSelectedViolationType('ALL')
                      setViolationPage(1)
                    }}
                  />
                  <ViolationLogTable
                    violations={violations}
                    onViewEvidence={setEvidenceUrl}
                    loading={loading}
                    pagination={violationPagination}
                    onPageChange={setViolationPage}
                    onRefresh={() => setRefreshVersion((current) => current + 1)}
                  />
                </TeacherTablePanel>
              )}
            </>
          )}
        </main>
      </div>

      {extensionTarget && (
        <ExtendTimeModal
          session={extensionTarget}
          submitting={isExtendingTime}
          onClose={() => setExtensionTarget(null)}
          onSubmit={extendAttemptTime}
        />
      )}

      <EvidenceImageModal
        imageUrl={evidenceUrl}
        onClose={() => setEvidenceUrl(null)}
        title="Ảnh bằng chứng vi phạm"
      />
    </div>
  )
}
