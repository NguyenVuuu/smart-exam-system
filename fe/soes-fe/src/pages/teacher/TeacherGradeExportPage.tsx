import {
  BarChart2,
  CheckCircle2,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppBadge from "../../components/common/AppBadge";
import AppSelect from "../../components/common/AppSelect";
import DataTable, { type ColumnDef } from "../../components/common/DataTable";
import { formatDateTime, formatSessionRange } from "../../utils/date.utils";
import {
  getTeacherExamSchedules,
  getTeacherExamSubmissions,
  getTeacherExams,
} from "./api/teacher-exams.api";
import TeacherPageHeader from "./components/TeacherPageHeader";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherTablePanel from "./components/TeacherTablePanel";
import TeacherToolbar from "./components/TeacherToolbar";
import TeacherTopBar from "./components/TeacherTopBar";
import { toExam, toExamSchedule } from "./mappers/teacher-exam.mapper";
import type { TeacherExamSubmissionDto } from "./types/teacher-exam-api.types";
import type { Exam, ExamSchedule } from "./types/teacher-exam.types";

interface StudentGradeRow {
  id: string;
  studentCode: string;
  studentName: string;
  classCode: string;
  submittedAt: string;
  totalScore: number;
  letterGrade: "A" | "B" | "C" | "D" | "F";
  status: string;
}

const SCORE_BUCKETS = [
  { label: "0 - 1", min: 0, max: 1 },
  { label: "1 - 2", min: 1, max: 2 },
  { label: "2 - 3", min: 2, max: 3 },
  { label: "3 - 4", min: 3, max: 4 },
  { label: "4 - 5", min: 4, max: 5 },
  { label: "5 - 6", min: 5, max: 6 },
  { label: "6 - 7", min: 6, max: 7 },
  { label: "7 - 8", min: 7, max: 8 },
  { label: "8 - 9", min: 8, max: 9 },
  { label: "9 - 10", min: 9, max: 10.1 },
];

const letterGradeTone = {
  A: "emerald",
  B: "blue",
  C: "amber",
  D: "rose",
  F: "rose",
} as const;

const statusLabel: Record<string, string> = {
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
  GRADING: "Đang chấm",
  GRADED: "Đã chấm",
  PUBLISHED: "Đã công bố",
  INVALIDATED: "Đã hủy",
};

const getLetterGrade = (score: number): StudentGradeRow["letterGrade"] => {
  if (score >= 8.5) return "A";
  if (score >= 7) return "B";
  if (score >= 5.5) return "C";
  if (score >= 4) return "D";
  return "F";
};

const normalizeScore = (score: number, totalPoints?: number) => {
  if (!totalPoints || totalPoints === 10) return score;
  return (score / totalPoints) * 10;
};

const SUBMISSION_REPORT_PAGE_SIZE = 100;

const getAllTeacherExamSubmissions = async (examId: string, scheduleId: string) => {
  const firstPage = await getTeacherExamSubmissions(
    examId,
    scheduleId,
    1,
    SUBMISSION_REPORT_PAGE_SIZE,
  );
  const items: TeacherExamSubmissionDto[] = [...firstPage.items];

  if (firstPage.pagination.totalPages <= 1) return items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      getTeacherExamSubmissions(
        examId,
        scheduleId,
        index + 2,
        SUBMISSION_REPORT_PAGE_SIZE,
      ),
    ),
  );

  remainingPages.forEach((page) => items.push(...page.items));
  return items;
};

export default function TeacherGradeExportPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);
  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedScheduleId);

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    setError(null);
    try {
      const rows = (await getTeacherExams()).map(toExam);
      setExams(rows);
      setSelectedExamId((current) => current || rows.find((exam) => (exam.scheduleCount ?? 0) > 0)?.id || rows[0]?.id || "");
    } catch {
      setError("Không thể tải danh sách bài thi.");
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (!selectedExamId) {
      setSchedules([]);
      setSelectedScheduleId("");
      return;
    }

    let active = true;
    setLoadingSchedules(true);
    setError(null);

    void getTeacherExamSchedules(selectedExamId)
      .then((rows) => {
        if (!active) return;
        const nextSchedules = rows.map(toExamSchedule);
        setSchedules(nextSchedules);
        setSelectedScheduleId(nextSchedules[0]?.id || "");
      })
      .catch(() => {
        if (!active) return;
        setSchedules([]);
        setSelectedScheduleId("");
        setError("Không thể tải danh sách ca thi của bài thi đã chọn.");
      })
      .finally(() => {
        if (active) setLoadingSchedules(false);
      });

    return () => {
      active = false;
    };
  }, [selectedExamId]);

  useEffect(() => {
    if (!selectedExamId || !selectedScheduleId || !selectedSchedule) {
      setGrades([]);
      return;
    }

    let active = true;
    setLoadingGrades(true);
    setError(null);

    void getAllTeacherExamSubmissions(selectedExamId, selectedScheduleId)
      .then((items) => {
        if (!active) return;
        setGrades(items
          .filter((item) => item.finalScore !== null)
          .map((item) => {
            const totalScore = normalizeScore(item.finalScore ?? 0, selectedExam?.totalPoints);
            return {
              id: item.id,
              studentCode: item.studentCode,
              studentName: item.studentName,
              classCode: selectedSchedule.courseCode,
              submittedAt: item.submittedAt ? formatDateTime(item.submittedAt) : "-",
              totalScore,
              letterGrade: getLetterGrade(totalScore),
              status: statusLabel[item.status] ?? item.status,
            };
          }));
      })
      .catch(() => {
        if (!active) return;
        setGrades([]);
        setError("Không thể tải điểm bài nộp của ca thi đã chọn.");
      })
      .finally(() => {
        if (active) setLoadingGrades(false);
      });

    return () => {
      active = false;
    };
  }, [selectedExam?.totalPoints, selectedExamId, selectedSchedule, selectedScheduleId]);

  const handleExportExcel = () => {
    alert("Chức năng xuất Excel sẽ sử dụng dữ liệu điểm của ca thi đang chọn.");
  };

  const filteredGrades = grades.filter(
    (g) =>
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.studentCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalCount = grades.length;
  const participantCount = selectedSchedule?.participantCount ?? totalCount;
  const completionRate = participantCount > 0 ? Math.round((totalCount / participantCount) * 100) : 0;
  const avgScore =
    totalCount > 0
      ? (grades.reduce((sum, g) => sum + g.totalScore, 0) / totalCount).toFixed(1)
      : "0.0";
  const passCount = grades.filter((g) => g.totalScore >= 5.0).length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const excellentCount = grades.filter((g) => g.totalScore >= 8.5).length;
  const goodCount = grades.filter((g) => g.totalScore >= 7.0 && g.totalScore < 8.5).length;
  const averageCount = grades.filter((g) => g.totalScore >= 5.0 && g.totalScore < 7.0).length;
  const weakCount = grades.filter((g) => g.totalScore < 5.0).length;
  const highestScore = totalCount > 0 ? Math.max(...grades.map((g) => g.totalScore)) : 0;
  const lowestScore = totalCount > 0 ? Math.min(...grades.map((g) => g.totalScore)) : 0;
  const scoreDistribution = SCORE_BUCKETS.map((bucket) => ({
    range: bucket.label,
    students: grades.filter((g) => g.totalScore >= bucket.min && g.totalScore < bucket.max).length,
  }));
  const mostCommonBucket = scoreDistribution.reduce(
    (current, bucket) => (bucket.students > current.students ? bucket : current),
    scoreDistribution[0],
  );
  const percentOfTotal = (count: number) =>
    totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

  const columns: ColumnDef<StudentGradeRow>[] = [
    {
      header: "STT",
      width: "50px",
      align: "center",
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: "MSSV",
      width: "120px",
      render: (g) => <span className="text-blue-600">{g.studentCode}</span>,
    },
    {
      header: "Họ và tên sinh viên",
      render: (g) => <span className="font-semibold text-gray-900">{g.studentName}</span>,
    },
    {
      header: "Lớp học phần",
      width: "150px",
      render: (g) => <span className="text-gray-600">{g.classCode}</span>,
    },
    {
      header: "Thời gian nộp",
      width: "150px",
      render: (g) => <span className="text-gray-600">{g.submittedAt}</span>,
    },
    {
      header: "Điểm bài thi",
      width: "120px",
      align: "center",
      render: (g) => (
        <span className="font-semibold text-xs text-gray-900">
          {g.totalScore.toFixed(1)}
        </span>
      ),
    },
    {
      header: "Điểm chữ",
      width: "100px",
      align: "center",
      render: (g) => (
        <AppBadge tone={letterGradeTone[g.letterGrade]} shape="rounded" className="text-xs">
          {g.letterGrade}
        </AppBadge>
      ),
    },
    {
      header: "Trạng thái",
      width: "120px",
      align: "center",
      render: (g) => <span className="text-xs font-medium text-gray-600">{g.status}</span>,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Khảo thí, phổ điểm & báo cáo kết quả"
            description="Thống kê phổ điểm theo từng ca thi để đánh giá kết quả học tập của lớp học phần"
            icon={<FileSpreadsheet size={21} />}
            actions={
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet size={16} /> Xuất bảng điểm Excel (.xlsx)
              </button>
            }
          />

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AppSelect
                value={selectedExamId}
                onChange={(value) => setSelectedExamId(value)}
                disabled={loadingExams || exams.length === 0}
                placeholder="Chọn bài thi"
                options={exams.map((exam) => ({
                  value: exam.id,
                  label: `${exam.title} - ${exam.subjectName}`,
                }))}
              />
              <AppSelect
                value={selectedScheduleId}
                onChange={(value) => setSelectedScheduleId(value)}
                disabled={loadingSchedules || schedules.length === 0}
                placeholder="Chọn ca thi"
                options={schedules.map((schedule) => ({
                  value: schedule.id,
                  label: `${schedule.courseCode || "Ca thi"} - ${formatSessionRange(schedule.startTime, schedule.endTime)}`,
                }))}
              />
            </div>
            {selectedExam && (
              <p className="mt-3 text-xs text-gray-500">
                Đang xem phổ điểm của ca thi:{" "}
                <span className="font-semibold text-gray-700">
                  {selectedSchedule
                    ? `${selectedSchedule.courseCode} - ${formatSessionRange(selectedSchedule.startTime, selectedSchedule.endTime)}`
                    : "Chưa có ca thi"}
                </span>
              </p>
            )}
            {error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">
                  Bài đã hoàn thành
                </span>
                <span className="text-2xl font-bold text-gray-900 block">
                  {totalCount} / {participantCount}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  {completionRate}% đã hoàn thành bài thi
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">
                  Điểm trung bình
                </span>
                <span className="text-2xl font-bold text-blue-600 block">
                  {avgScore} / 10
                </span>
                <span className="text-xs text-gray-400">Tính theo ca thi đang chọn</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-900 block">Thông tin điểm</span>
                <div className="space-y-2 border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500">Điểm cao nhất</span>
                    <span className="font-bold text-gray-900">{highestScore.toFixed(1)} / 10</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500">Điểm thấp nhất</span>
                    <span className="font-bold text-gray-900">{lowestScore.toFixed(1)} / 10</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-gray-500">Nhóm điểm đông nhất</span>
                    <span className="text-right font-bold text-gray-900">
                      {mostCommonBucket.students > 0 ? mostCommonBucket.range : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase">
                  Tỷ lệ đạt (&ge; 5.0)
                </span>
                <span className="text-2xl font-bold text-emerald-600 block">{passRate}%</span>
                <span className="text-xs text-gray-400">{passCount}/{totalCount} sinh viên đạt</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Phân bố điểm theo thang 10</h3>
                <p className="text-xs text-gray-500">
                  {totalCount} lượt nộp đã hoàn thành · Dữ liệu thuộc ca thi đang chọn
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                Số sinh viên
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 18, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Khoảng điểm", position: "insideBottom", offset: -4, fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Số sinh viên", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#eef2ff" }}
                    formatter={(value) => [`${value} sinh viên`, "Số sinh viên"]}
                    labelFormatter={(label) => `Khoảng ${label}`}
                  />
                  <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Giỏi / Xuất sắc [8.5 - 10]</span>
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-800">{excellentCount} SV</span>
                </div>
                <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percentOfTotal(excellentCount)}%` }} />
                </div>
                <span className="text-xs text-emerald-700 font-medium">{percentOfTotal(excellentCount)}% tổng số sinh viên</span>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Khá [7.0 - 8.4]</span>
                  <span className="bg-blue-200/80 px-2 py-0.5 rounded text-blue-800">{goodCount} SV</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percentOfTotal(goodCount)}%` }} />
                </div>
                <span className="text-xs text-blue-700 font-medium">{percentOfTotal(goodCount)}% tổng số sinh viên</span>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Trung bình [5.0 - 6.9]</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded text-amber-800">{averageCount} SV</span>
                </div>
                <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentOfTotal(averageCount)}%` }} />
                </div>
                <span className="text-xs text-amber-700 font-medium">{percentOfTotal(averageCount)}% tổng số sinh viên</span>
              </div>

              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Yếu / Kém [&lt; 5.0]</span>
                  <span className="bg-rose-200/80 px-2 py-0.5 rounded text-rose-800">{weakCount} SV</span>
                </div>
                <div className="w-full bg-rose-200/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentOfTotal(weakCount)}%` }} />
                </div>
                <span className="text-xs text-rose-700 font-medium">{percentOfTotal(weakCount)}% tổng số sinh viên</span>
              </div>
            </div>
          </div>

          <TeacherTablePanel>
            <TeacherToolbar
              filters={
                <div className="flex flex-col gap-3 lg:flex-row">
                  <AppSelect
                    value={selectedExamId}
                    onChange={(value) => setSelectedExamId(value)}
                    className="w-full lg:w-80"
                    disabled={loadingExams || exams.length === 0}
                    placeholder="Chọn bài thi"
                    options={exams.map((exam) => ({
                      value: exam.id,
                      label: exam.title,
                    }))}
                  />
                  <AppSelect
                    value={selectedScheduleId}
                    onChange={(value) => setSelectedScheduleId(value)}
                    className="w-full lg:w-96"
                    disabled={loadingSchedules || schedules.length === 0}
                    placeholder="Chọn ca thi"
                    options={schedules.map((schedule) => ({
                      value: schedule.id,
                      label: `${schedule.courseCode || "Ca thi"} - ${formatSessionRange(schedule.startTime, schedule.endTime)}`,
                    }))}
                  />
                </div>
              }
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Tìm theo MSSV hoặc họ tên sinh viên..."
              onReset={() => {
                setSelectedExamId(exams.find((exam) => (exam.scheduleCount ?? 0) > 0)?.id || exams[0]?.id || "");
                setSearchQuery("");
              }}
            />
            <DataTable
              embedded
              columns={columns}
              data={filteredGrades}
              keyExtractor={(g) => g.id}
              emptyText={
                loadingGrades
                  ? "Đang tải dữ liệu điểm..."
                  : selectedScheduleId
                    ? "Ca thi này chưa có bài nộp đã chấm."
                    : "Vui lòng chọn một ca thi để xem phổ điểm."
              }
              isLoading={loadingGrades}
            />
          </TeacherTablePanel>
        </main>
      </div>
    </div>
  );
}
