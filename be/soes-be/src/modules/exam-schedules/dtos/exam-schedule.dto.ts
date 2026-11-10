export interface ExamScheduleDto {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  maxAttempts: number;
  status: string;
  locationMode: string;
  distributionMode: string;
  resultReleaseMode: string;
  reviewPolicy: string;
  attemptCount: number;
  participantCount: number;
  submissionCount: number;
  hasPassword: boolean;
  enableTabLock: boolean;
  requireFullscreen: boolean;
  enableWebcam: boolean;
  enableScreenMonitoring: boolean;
  blockCopyPaste: boolean;
  blockRightClick: boolean;
  allowedIpRanges: string[];
  randomQuestionCount: number | null;
  resultReleaseAt: Date | null;
  reviewStartAt: Date | null;
  reviewEndAt: Date | null;
  exam: {
    id: string;
    title: string;
    type: string;
    subject: { id: string; code: string; name: string; departmentId: string };
  };
  courses: Array<{
    id: string;
    code: string;
    proctors: Array<{ id: string; code: string; fullName: string }>;
  }>;
  /** Danh sách sinh viên được phép vào ca — chỉ có giá trị với ca dự phòng */
  targetStudents: Array<{
    id: string
    studentCode: string
    fullName: string
  }>
  createdAt: Date;
  updatedAt: Date;
  /** ID của ca thi gốc nếu đây là ca dự phòng */
  makeupOfScheduleId?: string | null
}
