import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoreEntry, SelectOption } from "../types/dashboard.types";

interface DashboardAnalyticsProps {
  semesterOptions: SelectOption[];
  scoreTypeOptions: SelectOption[];
  data: ScoreEntry[];
  selectedSemester: string;
  selectedScoreType: string;
  onSemesterChange: (v: string) => void;
  onScoreTypeChange: (v: string) => void;
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

interface TooltipPosition {
  left: number;
  top: number;
}

const CLASS_AVERAGE_COLOR = "#4F46E5";
const STUDENT_SCORE_COLOR = "#06B6D4";
const CHART_HEIGHT = 340;
const X_AXIS_HEIGHT = 36;
const AXIS_LABEL_WIDTH = 30;
const SCORE_TICK_WIDTH = 30;
// const BAND_LABEL_WIDTH = 124;
const GUTTER_WIDTH = AXIS_LABEL_WIDTH + SCORE_TICK_WIDTH;
const TOOLTIP_WIDTH = 236;
const TOOLTIP_HEIGHT = 136;
const TOOLTIP_GAP = 10;

const CHART_MARGIN = {
  top: 10,
  right: 20,
  bottom: 8,
  left: 0,
};

const PLOT_HEIGHT =
  CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom - X_AXIS_HEIGHT;

const SCORE_BANDS = [
  { y1: 8, y2: 10, label: "Giỏi", fill: "#ECFEFF" },
  { y1: 6.5, y2: 8, label: "Khá", fill: "#EEF2FF" },
  { y1: 5, y2: 6.5, label: "Trung bình", fill: "#FFFBEB" },
  { y1: 0, y2: 5, label: "Yếu", fill: "#FFF1F2" },
];

const SCORE_TICKS = [0, 5, 6.5, 8, 10];

function formatScore(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function getDiffColor(diff: number): string {
  if (diff > 0) return "text-emerald-300";
  if (diff < 0) return "text-rose-300";
  return "text-slate-300";
}

function getExamTypeLabel(
  options: SelectOption[],
  selectedScoreType: string,
): string {
  return (
    options.find((option) => option.value === selectedScoreType)?.label ??
    selectedScoreType
  );
}

function truncateSubject(subject: string): string {
  const normalized = subject.replace("\n", " ");
  return normalized.length > 18 ? `${normalized.slice(0, 16)}...` : normalized;
}

function getScoreTop(value: number): string {
  return `${CHART_MARGIN.top + ((10 - value) / 10) * PLOT_HEIGHT}px`;
}

function getBandLabelTop(band: (typeof SCORE_BANDS)[number]): string {
  return getScoreTop(band.y1 + (band.y2 - band.y1) / 2);
}

function getBandTop(band: (typeof SCORE_BANDS)[number]): string {
  return getScoreTop(band.y2);
}

function getBandHeight(band: (typeof SCORE_BANDS)[number]): string {
  return `${((band.y2 - band.y1) / 10) * PLOT_HEIGHT}px`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const [animatedDatasetKey, setAnimatedDatasetKey] = useState<string | null>(
    null,
  );
  const [reducedMotion] = useState(prefersReducedMotion);
  const leaveTimeoutRef = useRef<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(
    () => data.map((entry, index) => ({ ...entry, index })),
    [data],
  );
  const dataVersion = useMemo(
    () =>
      data
        .map(
          (entry) =>
            `${entry.subject}:${entry.studentScore}:${entry.classAverage}`,
        )
        .join("|"),
    [data],
  );
  const datasetKey = `${selectedSemester}-${selectedScoreType}-${dataVersion}`;
  const shouldAnimateEntry =
    !reducedMotion && animatedDatasetKey !== datasetKey;
  const activeDatum =
    activeIndex === null ? null : (chartData[activeIndex] ?? null);
  const examTypeLabel = getExamTypeLabel(scoreTypeOptions, selectedScoreType);
  const footerNote =
    selectedScoreType === "QUIZ"
      ? "Với bài thường kỳ: điểm mỗi môn là trung bình các bài đã làm; điểm lớp là trung bình từ điểm trung bình của từng sinh viên."
      : "Giữa kỳ và cuối kỳ chỉ có một bài thi; biểu đồ hiển thị điểm của bạn và điểm trung bình lớp của bài thi đó.";

  function clearLeaveTimeout() {
    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }

  function clearActive() {
    setActiveIndex(null);
    setTooltipPosition(null);
  }

  function scheduleClearActive(resetTimer = true) {
    if (!resetTimer && leaveTimeoutRef.current !== null) return;
    clearLeaveTimeout();
    leaveTimeoutRef.current = window.setTimeout(() => {
      clearActive();
      leaveTimeoutRef.current = null;
    }, 250);
  }

  function handlePlotMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-score-bar="true"]')) return;
    scheduleClearActive(false);
  }

  function activateBar(
    index: number | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    if (index === undefined) return;

    clearLeaveTimeout();
    setActiveIndex(index);

    const plotWidth = plotRef.current?.clientWidth ?? 0;
    const plotHeight = plotRef.current?.clientHeight ?? CHART_HEIGHT;
    const barCenterX = x + width / 2;
    const aboveTop = y - TOOLTIP_HEIGHT - TOOLTIP_GAP;
    const belowTop = y + height + TOOLTIP_GAP;
    const nextLeft = Math.min(
      Math.max(barCenterX - TOOLTIP_WIDTH / 2, 8),
      Math.max(8, plotWidth - TOOLTIP_WIDTH - 8),
    );
    const nextTop =
      aboveTop >= 8
        ? aboveTop
        : Math.min(
            Math.max(belowTop, 8),
            Math.max(8, plotHeight - TOOLTIP_HEIGHT - 8),
          );

    setTooltipPosition({ left: nextLeft, top: nextTop });
  }

  function markDatasetAnimated() {
    setAnimatedDatasetKey(datasetKey);
  }

  function renderBarShape(props: BarShapeProps) {
    const { x = 0, y = 0, width = 0, height = 0, index } = props;
    const isActive = index === activeIndex;

    return (
      <rect
        data-score-bar="true"
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={CLASS_AVERAGE_COLOR}
        opacity={isActive ? 0.96 : 0.82}
        stroke={isActive ? "#E0E7FF" : "transparent"}
        strokeWidth={isActive ? 1.5 : 0}
        style={{
          cursor: "pointer",
          filter: isActive
            ? "drop-shadow(0 6px 12px rgba(79,70,229,.18))"
            : "none",
          transition:
            "opacity 180ms ease, filter 180ms ease, stroke 180ms ease",
        }}
        onMouseEnter={() => activateBar(index, x, y, width, height)}
        onMouseMove={() => activateBar(index, x, y, width, height)}
        onMouseLeave={() => scheduleClearActive()}
      />
    );
  }

  function renderDot(props: DotProps) {
    const { cx = 0, cy = 0, index } = props;
    const isActive = index === activeIndex;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isActive ? 6.5 : 4.8}
        fill={STUDENT_SCORE_COLOR}
        stroke="#fff"
        strokeWidth={isActive ? 3 : 2.4}
        style={{
          filter: isActive
            ? "drop-shadow(0 4px 10px rgba(6,182,212,.42))"
            : "none",
          transition:
            "r 180ms ease, stroke-width 180ms ease, filter 180ms ease",
        }}
      />
    );
  }

  return (
    <div className="mb-6 w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .student-score-tooltip { transition: left 170ms ease, top 170ms ease, opacity 170ms ease; }
          }
        `}
      </style>

      <div className="mb-5 flex w-full min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            So sánh điểm theo môn học
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            So sánh điểm của bạn với điểm trung bình lớp theo loại bài thi đã
            chọn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {semesterOptions.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              Học kỳ
              <select
                value={selectedSemester}
                onChange={(e) => {
                  clearActive();
                  onSemesterChange(e.target.value);
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                {semesterOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Loại bài thi
            <select
              value={selectedScoreType}
              onChange={(e) => {
                clearActive();
                onScoreTypeChange(e.target.value);
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            >
              {scoreTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {data.length === 0 && (
        <div className="flex h-40 w-full min-w-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          Chưa có dữ liệu điểm để hiển thị.
        </div>
      )}

      {data.length > 0 && (
        <div
          className="grid w-full min-w-0 overflow-hidden rounded-lg bg-white"
          style={{ gridTemplateColumns: `${GUTTER_WIDTH}px minmax(0, 1fr)` }}
        >
          <div
            className="relative grid"
            style={{
              height: CHART_HEIGHT,
              width: GUTTER_WIDTH,
              gridTemplateColumns: `${AXIS_LABEL_WIDTH}px ${SCORE_TICK_WIDTH}px`,
            }}
          >
            {SCORE_BANDS.map((band) => (
              <div
                key={`${band.label}-gutter-bg`}
                className="absolute inset-x-0"
                style={{
                  top: getBandTop(band),
                  height: getBandHeight(band),
                  backgroundColor: band.fill,
                }}
              />
            ))}
            <div className="relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[11px] font-semibold text-slate-600">
                Thang điểm 10
              </div>
            </div>

            <div className="relative">
              {SCORE_TICKS.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-1.5 -translate-y-1/2 text-[11px] font-medium text-slate-500"
                  style={{ top: getScoreTop(tick) }}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full min-w-0 overflow-x-auto">
            <div
              ref={plotRef}
              className="relative h-[340px] w-full min-w-[560px]"
              onMouseMove={handlePlotMouseMove}
              onMouseLeave={() => scheduleClearActive()}
            >
              <div
                className="pointer-events-none absolute left-0 z-10 w-px bg-slate-400"
                style={{
                  top: CHART_MARGIN.top,
                  height: PLOT_HEIGHT,
                }}
              />
              <div
                className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-slate-400"
                style={{ top: getScoreTop(0) }}
              />
              {SCORE_BANDS.map((band) => (
                <div
                  key={`${band.label}-chart-label`}
                  className="pointer-events-none absolute z-10 -translate-y-1/2 pl-2 text-[10px] font-semibold leading-tight text-slate-500"
                  style={{ top: getBandLabelTop(band), left: 4 }}
                >
                  {band.label}
                </div>
              ))}
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chartData} margin={CHART_MARGIN}>
                  {SCORE_BANDS.map((band) => (
                    <ReferenceArea
                      key={band.label}
                      y1={band.y1}
                      y2={band.y2}
                      fill={band.fill}
                      fillOpacity={1}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                    />
                  ))}

                  <CartesianGrid
                    vertical={false}
                    stroke="#CBD5E1"
                    strokeDasharray="4 5"
                  />
                  <XAxis
                    dataKey="subject"
                    interval={0}
                    height={X_AXIS_HEIGHT}
                    tickLine={false}
                    axisLine={{ stroke: "#94A3B8", strokeWidth: 1.2 }}
                    tick={({ x, y, payload }) => (
                      <text
                        x={Number(x)}
                        y={Number(y) + 14}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={11}
                      >
                        {truncateSubject(String(payload.value))}
                      </text>
                    )}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 10]}
                    ticks={SCORE_TICKS}
                    hide
                    width={0}
                  />

                  <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.2} />

                  {activeDatum && (
                    <ReferenceLine
                      x={activeDatum.subject}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeOpacity={0.72}
                      strokeWidth={1.2}
                    />
                  )}

                  <Tooltip
                    cursor={false}
                    content={() => null}
                    allowEscapeViewBox={{ x: false, y: false }}
                    wrapperStyle={{ outline: "none", pointerEvents: "none" }}
                  />
                  <Bar
                    dataKey="classAverage"
                    name="Trung bình lớp"
                    barSize={46}
                    shape={renderBarShape}
                    isAnimationActive={shouldAnimateEntry}
                    animationDuration={560}
                    animationEasing="ease-out"
                    onAnimationEnd={markDatasetAnimated}
                  />
                  <Line
                    type="linear"
                    dataKey="studentScore"
                    name="Điểm của bạn"
                    stroke={STUDENT_SCORE_COLOR}
                    strokeWidth={3}
                    dot={renderDot}
                    activeDot={false}
                    isAnimationActive={shouldAnimateEntry}
                    animationDuration={560}
                    animationEasing="ease-out"
                    onAnimationEnd={markDatasetAnimated}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {activeDatum && tooltipPosition && (
                <div
                  className="student-score-tooltip pointer-events-none absolute z-20 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-slate-100 shadow-xl"
                  style={{
                    left: tooltipPosition.left,
                    top: tooltipPosition.top,
                    width: TOOLTIP_WIDTH,
                  }}
                >
                  <p className="mb-2 font-semibold leading-tight text-white">
                    {activeDatum.subject.replace("\n", " ")}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-5">
                      <span className="text-slate-400">Điểm của bạn</span>
                      <span className="ml-auto font-semibold text-cyan-300">
                        {formatScore(activeDatum.studentScore)}
                      </span>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="text-slate-400">Trung bình lớp</span>
                      <span className="ml-auto font-semibold text-indigo-200">
                        {formatScore(activeDatum.classAverage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="text-slate-400">Chênh lệch</span>
                      <span
                        className={`ml-auto font-semibold ${getDiffColor(activeDatum.studentScore - activeDatum.classAverage)}`}
                      >
                        {activeDatum.studentScore - activeDatum.classAverage > 0
                          ? "+"
                          : ""}
                        {formatScore(
                          activeDatum.studentScore - activeDatum.classAverage,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                    {examTypeLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: CLASS_AVERAGE_COLOR }}
            />
            Trung bình lớp
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative h-3 w-7">
              <span
                className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: STUDENT_SCORE_COLOR }}
              />
              <span
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: STUDENT_SCORE_COLOR }}
              />
            </span>
            Điểm của bạn
          </div>
        </div>
        <p className="min-w-[260px] flex-1 text-xs leading-relaxed text-slate-500">
          {footerNote}
        </p>
      </div>
    </div>
  );
}
