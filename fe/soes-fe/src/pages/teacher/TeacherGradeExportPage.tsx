import { FileDown, GraduationCap } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import GradeAppealReviewPanel from './components/grade-export/GradeAppealReviewPanel'
import GradeAppealsPanel from './components/grade-export/GradeAppealsPanel'
import GradeReportPanel from './components/grade-export/GradeReportPanel'
import GradeReportTabs, { type GradeReportTab } from './components/grade-export/GradeReportTabs'
import TeacherNotificationsPanel from './components/grade-export/TeacherNotificationsPanel'
import { useTeacherGradeAppeals } from './hooks/useTeacherGradeAppeals'
import { useTeacherGradeReport } from './hooks/useTeacherGradeReport'
import { useTeacherNotificationsStore } from './store/teacherNotificationsStore'

function activeTabFrom(params: URLSearchParams): GradeReportTab {
  const tab = params.get('tab')
  return tab === 'appeals' || tab === 'notifications' ? tab : 'reports'
}

export default function TeacherGradeExportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = activeTabFrom(searchParams)
  const report = useTeacherGradeReport()
  const appeal = useTeacherGradeAppeals()
  const notificationCount = useTeacherNotificationsStore((state) => state.items.length)

  const changeTab = (tab: GradeReportTab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'reports') nextParams.delete('tab')
    else nextParams.set('tab', tab)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <TeacherPageHeader
              title="Kết quả & Phúc khảo"
              description="Theo dõi kết quả, phân tích phổ điểm, xuất dữ liệu và xử lý yêu cầu phúc khảo."
              icon={<GraduationCap size={20} />}
              actions={activeTab === 'reports' ? (
                <button
                  type="button"
                  onClick={report.exportCsv}
                  disabled={report.rows.length === 0}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileDown size={16} /> Xuất CSV
                </button>
              ) : undefined}
            />

            <GradeReportTabs
              activeTab={activeTab}
              appealCount={appeal.pagination.totalItems}
              notificationCount={notificationCount}
              onChange={changeTab}
            />

            <div className="pt-5">
              {activeTab === 'reports' && (
                <GradeReportPanel
                  exams={report.exams}
                  schedules={report.schedules}
                  selectedExamId={report.selectedExamId}
                  selectedScheduleId={report.selectedScheduleId}
                  searchKeyword={report.searchKeyword}
                  rows={report.rows}
                  statistics={report.statistics}
                  chartData={report.chartData}
                  loading={report.loading}
                  onExamChange={report.selectExam}
                  onScheduleChange={report.selectSchedule}
                  onSearchChange={report.setSearchKeyword}
                />
              )}

              {activeTab === 'appeals' && (
                <div className="space-y-5">
                  <GradeAppealsPanel
                    appeals={appeal.appeals}
                    pagination={appeal.pagination}
                    status={appeal.status}
                    replies={appeal.replies}
                    loading={appeal.loading}
                    onStatusChange={appeal.changeStatus}
                    onPageChange={appeal.setPage}
                    onReplyChange={appeal.updateReply}
                    onOpenSubmission={appeal.openSubmission}
                    onUpdateAppeal={appeal.updateAppeal}
                  />
                  {appeal.selectedAppeal && (
                    <GradeAppealReviewPanel
                      appeal={appeal.selectedAppeal}
                      exam={appeal.selectedExam}
                      submission={appeal.selectedSubmission}
                      score={appeal.score}
                      reason={appeal.reason}
                      loading={appeal.loadingSubmission}
                      saving={appeal.savingScore}
                      onScoreChange={appeal.setScore}
                      onReasonChange={appeal.setReason}
                      onClose={appeal.closeSubmission}
                      onSave={appeal.saveScore}
                    />
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <TeacherNotificationsPanel onViewAppeals={() => changeTab('appeals')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
