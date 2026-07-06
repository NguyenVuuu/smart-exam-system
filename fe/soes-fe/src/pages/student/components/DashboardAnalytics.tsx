import { useRef, useState } from 'react'
import type { ScoreEntry, SelectOption } from '../types/dashboard.types'

interface TooltipState {
  x: number
  y: number
  entry: ScoreEntry
}

interface DashboardAnalyticsProps {
  semesterOptions: SelectOption[]
  scoreTypeOptions: SelectOption[]
  data: ScoreEntry[]
  selectedSemester: string
  selectedScoreType: string
  onSemesterChange: (v: string) => void
  onScoreTypeChange: (v: string) => void
}

const CHART_H   = 220
const Y_MIN     = 0
const Y_MAX     = 10
const Y_TICKS   = [0, 2, 4, 6, 8, 10]
const PAD_LEFT  = 32
const PAD_RIGHT = 16
const PAD_TOP   = 8
const PAD_BOT   = 48

function yPx(value: number, height: number): number {
  return height - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * height
}

export default function DashboardAnalytics({
  semesterOptions,
  scoreTypeOptions,
  data,
  selectedSemester,
  selectedScoreType,
  onSemesterChange,
  onScoreTypeChange,
}: DashboardAnalyticsProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = data.length
  // Each bar slot width derived from a fixed viewBox width so bars fill the full area
  const VB_W = 800
  const slotW = n > 0 ? (VB_W - PAD_LEFT - PAD_RIGHT) / n : 0
  const barW  = Math.min(slotW * 0.55, 56)
  const VB_H  = CHART_H + PAD_TOP + PAD_BOT

  const barX = (i: number) => PAD_LEFT + i * slotW + (slotW - barW) / 2
  const barCx = (i: number) => barX(i) + barW / 2

  function handleBarEnter(i: number, entry: ScoreEntry, e: React.MouseEvent<SVGRectElement>) {
    setHoveredIndex(i)
    const svgEl = svgRef.current
    if (!svgEl) return
    const svgRect = svgEl.getBoundingClientRect()
    const rect    = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left - svgRect.left + rect.width / 2,
      y: rect.top  - svgRect.top,
      entry,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          📈 Phân tích kết quả học tập
        </h2>

        {semesterOptions.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-gray-500">HK:</span>
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {semesterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Loại điểm:</span>
          <select
            value={selectedScoreType}
            onChange={(e) => onScoreTypeChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {scoreTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Chưa có dữ liệu điểm để hiển thị.
        </div>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div
          className="relative w-full"
          onMouseLeave={() => { setTooltip(null); setHoveredIndex(null) }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            height={VB_H}
            preserveAspectRatio="none"
          >
            {/* Grid lines + Y labels */}
            {Y_TICKS.map((tick) => {
              const y = yPx(tick, CHART_H) + PAD_TOP
              return (
                <g key={tick}>
                  <line
                    x1={PAD_LEFT} y1={y}
                    x2={VB_W - PAD_RIGHT} y2={y}
                    stroke={tick === 0 ? '#e5e7eb' : '#f3f4f6'}
                    strokeWidth={tick === 0 ? 1.5 : 1}
                  />
                  <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#9ca3af">
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* Bars */}
            {data.map((entry, i) => {
              const bx  = barX(i)
              const bH  = Math.max(2, ((entry.studentScore - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_H)
              const bY  = CHART_H - bH + PAD_TOP
              const isHovered = hoveredIndex === i

              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={bx} y={bY}
                    width={barW} height={bH}
                    fill={isHovered ? '#2563eb' : '#3b82f6'}
                    rx={5}
                    style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                    onMouseEnter={(e) => handleBarEnter(i, entry, e)}
                  />
                  {/* X label — support two lines split by \n */}
                  {entry.subject.split('\n').map((line, li) => (
                    <text
                      key={li}
                      x={barCx(i)}
                      y={CHART_H + PAD_TOP + 16 + li * 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#6b7280"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {/* Class average line */}
            <polyline
              points={data.map((entry, i) =>
                `${barCx(i)},${yPx(entry.classAverage, CHART_H) + PAD_TOP}`,
              ).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Class average dots */}
            {data.map((entry, i) => (
              <circle
                key={`dot-${i}`}
                cx={barCx(i)}
                cy={yPx(entry.classAverage, CHART_H) + PAD_TOP}
                r={4}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none z-20 min-w-[130px]"
              style={{
                left:      tooltip.x - 65,
                top:       tooltip.y - 80,
                transform: 'translateY(-4px)',
              }}
            >
              <p className="font-semibold text-gray-800 mb-1.5 leading-tight">
                {tooltip.entry.subject.replace('\n', ' ')}
              </p>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-sm bg-blue-500 shrink-0" />
                <span className="text-gray-500">Của bạn:</span>
                <span className="font-bold text-gray-900 ml-auto">{tooltip.entry.studentScore.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-gray-500">TB lớp:</span>
                <span className="font-bold text-gray-900 ml-auto">{tooltip.entry.classAverage.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-gray-500">Điểm của bạn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400 -ml-3" />
          <span className="text-xs text-gray-500">TB lớp</span>
        </div>
      </div>
    </div>
  )
}
