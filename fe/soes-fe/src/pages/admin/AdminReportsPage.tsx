import { BarChart3, Download, RefreshCw } from 'lucide-react'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import ReportAnalyticsPanel from './components/reports/ReportAnalyticsPanel'
import ReportKpiGrid from './components/reports/ReportKpiGrid'
import ReportReviewSection from './components/reports/ReportReviewSection'
import ReportScheduleTable from './components/reports/ReportScheduleTable'
import { useAdminReportsOverview } from './hooks/useAdminMonitoring'
import { exportAdminReportCsv } from './utils/admin-report.utils'

export default function AdminReportsPage() {
  const { data, loading, error, retry } = useAdminReportsOverview()
  const rows = data?.rows ?? []
  const lowCorrectQuestions = data?.lowCorrectQuestions ?? []
  const reviewAttempts = data?.reviewAttempts ?? []
  const kpis = data?.kpis ?? { schedules: 0, submissionRate: 0, averageScore: 0, violations: 0 }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BarChart3 size={20} />}
        title="Báo cáo"
        description="Dùng sau khi ca thi kết thúc: tổng hợp kết quả, phổ điểm, chất lượng câu hỏi và danh sách bài cần rà soát."
        action={(
          <div className="flex gap-2">
            <AdminButton tone="secondary" icon={<RefreshCw size={17} />} onClick={retry} disabled={loading}>Làm mới</AdminButton>
            <AdminButton icon={<Download size={17} />} onClick={() => exportAdminReportCsv(rows)} disabled={rows.length === 0}>Xuất CSV</AdminButton>
          </div>
        )}
      />

      <div className="space-y-5">
        <ReportKpiGrid kpis={kpis} loading={loading} />
        <ReportAnalyticsPanel
          distribution={data?.distribution ?? []}
          lowCorrectQuestionCount={lowCorrectQuestions.length}
          reviewAttemptCount={reviewAttempts.length}
          schedulesWithViolations={rows.filter((row) => row.violations > 0).length}
        />

        {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <ReportReviewSection questions={lowCorrectQuestions} attempts={reviewAttempts} loading={loading} />
        <ReportScheduleTable rows={rows} loading={loading} />
      </div>
    </AdminLayout>
  )
}
