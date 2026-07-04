import { useState } from 'react'
import type { ScoreEntry, SemesterOption, ScoreTypeOption } from '../types/dashboard.types'

interface TooltipState {
  x: number
  y: number
  entry: ScoreEntry
}

interface DashboardAnalyticsProps {
  semesterOptions: SemesterOption[]
  scoreTypeOptions: ScoreTypeOption[]
  data: ScoreEntry[]
  selectedSemester: string
  selectedScoreType: string
  onSemesterChange: (v: string) => void
  onScoreTypeChange: (v: string) => void
}

const CHART_HEIGHT = 200
const BAR_WIDTH = 48
const GROUP_GAP = 32
const Y_MIN = 6
const Y_MAX = 10
const Y_TICKS = [6, 7, 8, 9, 10]

function yPos(value: number): number {
  return CHART_HEIGHT - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_HEIGHT
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

  const totalWidth = data.length * (BAR_WIDTH + GROUP_GAP)
  const svgWidth = totalWidth + 40
  const paddingLeft = 36
  const paddingBottom = 32

  const barCenters = data.map((_, i) => paddingLeft + i * (BAR_WIDTH + GROUP_GAP) + BAR_WIDTH / 2)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
          📈 Phân tích kết quả học tập
        </h2>
        <div className="flex items-center gap-2 ml-2">
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
        <div className="flex items-center gap-2">
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

      {/* Chart */}
      <div className="overflow-x-auto relative">
        <svg
          width={svgWidth + paddingLeft}
          height={CHART_HEIGHT + paddingBottom + 8}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y axis ticks */}
          {Y_TICKS.map((tick) => {
            const y = yPos(tick) + 8
            return (
              <g key={tick}>
                <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#9ca3af">
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth + paddingLeft - 8}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth={1}
                />
              </g>
            )
          })}

          {/* Bars */}
          {data.map((entry, i) => {
            const x = paddingLeft + i * (BAR_WIDTH + GROUP_GAP)
            const barH = ((entry.studentScore - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_HEIGHT
            const barY = CHART_HEIGHT - barH + 8

            return (
              <g key={entry.subject}>
                <rect
                  x={x}
                  y={barY}
                  width={BAR_WIDTH}
                  height={barH}
                  fill="#3b82f6"
                  rx={4}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
                    const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                    setTooltip({
                      x: rect.left - svgRect.left + BAR_WIDTH / 2,
                      y: barY - 12,
                      entry,
                    })
                  }}
                />
                {/* X label */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + paddingBottom - 4}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#6b7280"
                >
                  {entry.subject}
                </text>
              </g>
            )
          })}

          {/* Line (class average) */}
          {data.length > 0 && (
            <polyline
              points={barCenters
                .map((cx, i) => `${cx},${yPos(data[i].classAverage) + 8}`)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Line dots */}
          {data.map((entry, i) => (
            <circle
              key={`dot-${entry.subject}`}
              cx={barCenters[i]}
              cy={yPos(entry.classAverage) + 8}
              r={4}
              fill="#f59e0b"
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs pointer-events-none z-10"
            style={{ left: tooltip.x - 60, top: tooltip.y - 70 }}
          >
            <p className="font-semibold text-gray-800 mb-1">{tooltip.entry.subject}</p>
            <p className="text-gray-600">
              Điểm của bạn :{' '}
              <span className="font-bold text-gray-900">{tooltip.entry.studentScore}</span>
            </p>
            <p className="text-gray-600">
              TB lớp :{' '}
              <span className="font-bold text-gray-900">{tooltip.entry.classAverage}</span>
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-gray-500">Điểm của bạn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400 -ml-2" />
          <span className="text-xs text-gray-500">TB lớp</span>
        </div>
      </div>
    </div>
  )
}
