export interface ProctoringMetricsProps {
  onlineCount: number
  cameraActiveCount: number
  screenActiveCount: number
  totalViolationCount: number
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-2xs">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

export default function ProctoringMetrics({
  onlineCount,
  cameraActiveCount,
  screenActiveCount,
  totalViolationCount,
}: ProctoringMetricsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricCard label="Online" value={onlineCount} tone="text-blue-600" />
      <MetricCard label="Camera đang bật" value={cameraActiveCount} tone="text-emerald-600" />
      <MetricCard label="Màn hình đang chia sẻ" value={screenActiveCount} tone="text-cyan-600" />
      <MetricCard label="Vi phạm trong ca" value={totalViolationCount} tone="text-rose-600" />
    </div>
  )
}
