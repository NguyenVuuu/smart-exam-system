# System Architecture

## Tổng quan

SOES triển khai theo mô hình modular monolith:

- Frontend: React/Vite SPA.
- Backend: Express/TypeScript API server.
- Database: PostgreSQL qua Prisma ORM.
- Realtime: Socket.IO, có Redis adapter.
- Storage: Supabase Storage cho tài liệu/asset, MinIO cho bằng chứng proctoring.
- External services: Gemini AI, Judge0 CE.

```text
React/Vite SPA
    |
    | REST API + Socket.IO
    v
Express/TypeScript Backend
    |
    +-- PostgreSQL/Prisma
    +-- Redis
    +-- Supabase Storage
    +-- MinIO
    +-- Gemini API
    +-- Judge0 CE
```

## Frontend

Thư mục chính: `fe/soes-fe/src`.

Kiến trúc frontend tổ chức theo khu vực người dùng:

- `pages/admin`: quản trị học vụ, người dùng, lịch thi, ngân hàng câu hỏi, báo cáo, audit log, settings.
- `pages/teacher`: lớp học phần, ngân hàng câu hỏi, AI generator, đề thi, coi thi, chấm điểm, phúc khảo.
- `pages/student`: dashboard, lớp học phần, lịch thi, làm bài, kết quả, thông báo, cài đặt.
- `router`: phân quyền route theo `ADMIN`, `TEACHER`, `STUDENT`.
- `store`: Zustand stores cho auth và system settings.

Các route đang được khai báo trong `src/router/AppRouter.tsx`.

## Backend

Thư mục chính: `be/soes-be/src`.

Backend mount các nhóm route trong `src/app.ts`:

- `/api/auth`
- `/api/system-settings`
- `/api/student`
- `/api/student/course-offerings`
- `/api/admin`
- `/api/teacher`
- `/api/teacher/notifications`

Các module chính:

- `auth`: đăng nhập, refresh token, logout, hồ sơ cá nhân, đổi mật khẩu.
- `admin-academic`: semester, department, subject, course offering.
- `admin-users`: users, enrollment, reset password, status.
- `admin-content`: shared question bank, exam tracking.
- `admin-audit-logs`: audit log list/detail/export/overview.
- `admin-monitoring`: proctoring/report overview cho admin.
- `admin-system-settings`: settings, logo, defaults, integration health.
- `teacher-courses`: lớp học phần, materials, posts, students, exams, gradebook, proctor assignments.
- `teacher-questions`: question bank, question image upload, AI source file upload, audit, share/archive/restore, approvals.
- `teacher-exams`: exam CRUD, schedules, makeup schedules, submissions, grading, result release, proctoring, live signaling fallback.
- `ai-question-generation`: AI generation histories/materials/generate/review.
- `student-dashboard`, `student-subjects`, `student-course-detail`, `student-portal`, `student-take-exam`.
- `grade-appeals`: student tạo phúc khảo, teacher xử lý.
- `notifications`: notification list/read cho teacher.
- `proctoring`: Socket.IO realtime gateway.

Mỗi module thường có các lớp `routes`, `controllers`, `services`, `repositories`, `validators`, `mappers`, `dtos`.

## Authentication and Authorization

- Login dùng `identifier` theo prefix:
  - `SV...`: Student
  - `GV...`: Teacher
  - `AD...`: Admin
- Access token là JWT chứa `sub`, `profileId`, `role`.
- Refresh token lưu trong HttpOnly cookie và Redis.
- Student bị giới hạn một phiên đăng nhập đang hoạt động; Teacher/Admin có thể đăng nhập lại từ nhiều thiết bị.
- Route frontend kiểm soát vai trò bằng `RoleRoute`.

## Database

Prisma schema nằm tại `be/soes-be/prisma/schema.prisma`.

Các domain chính:

- Identity: `User`, `Student`, `Teacher`, `Admin`.
- Academic: `Department`, `Semester`, `Subject`, `CourseOffering`, `Enrollment`.
- Content: `Post`, `PostAttachment`, `Material`.
- Question bank: `QuestionBank`, `QuestionBankItem`, `Question`, `QuestionOption`, programming config/test cases.
- AI: `AIGenerationHistory`, `AIGenerationMaterial`.
- Exam: `Exam`, `ExamSection`, `ExamQuestion`, `ExamSchedule`, `ExamScheduleCourse`, `ExamScheduleStudent`, `ExamScheduleProctor`.
- Attempt/grading: `ExamAttempt`, `ExamAttemptQuestion`, `StudentAnswer`, `ProgrammingSubmission`, `ProgrammingSubmissionTestResult`.
- Proctoring: `ExamSession`, `Violation`, `ViolationEvidence`.
- System: `Notification`, `AuditLog`, `CodeGenerationSetting`, `GradeAppeal`.

## Realtime Proctoring

Socket.IO gateway trong `src/modules/proctoring/proctoring-realtime.gateway.ts` xử lý:

- Join schedule room: `proctoring:join_schedule`.
- Join attempt room: `proctoring:join_attempt`.
- Request live webcam/screen: `live:request_camera`, `live:request_screen`.
- WebRTC signaling: `live:student_offer`, `live:teacher_answer`, `live:student_candidate`, `live:teacher_candidate`, `live:end`.
- Broadcast heartbeat/offline/violation events cho dashboard giảng viên.

Redis lưu live session state để hỗ trợ nhiều backend instance.

## Storage

- MinIO lưu `ViolationEvidence` với bucket cấu hình bằng `MINIO_EVIDENCE_BUCKET`.
- Supabase Storage lưu course materials, question images, AI source files và system assets.
- PostgreSQL chỉ lưu metadata/path/object key, không lưu binary file.

## Code Execution

Judge0 CE dùng cho câu hỏi lập trình:

- Sinh viên chạy thử code trong khi làm bài.
- Khi nộp bài, hệ thống tạo `ProgrammingSubmission` chính thức và lưu kết quả từng test case.
- Ngôn ngữ hiện hỗ trợ theo enum Prisma: `JAVA`, `C`, `CPP`.

## AI Generation

Gemini được gọi trong module `ai-question-generation`.

Luồng chính:

1. Teacher chọn source từ course material hoặc upload file.
2. Backend đọc tài liệu và gọi Gemini.
3. Kết quả được validate/normalize.
4. Lưu `AIGenerationHistory`, source files/material links và câu hỏi sinh ra.
5. Teacher review trước khi dùng câu hỏi trong bank hoặc exam.

## Local Infrastructure

`docker-compose.yml` hiện chạy:

- `postgres`
- `redis`
- `minio`
- `judge0-db`
- `judge0-server`
- `judge0-workers`

Frontend và backend không nằm trong compose, chạy bằng `npm run dev` trong từng thư mục.
