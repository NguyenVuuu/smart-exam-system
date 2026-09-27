# System Architecture

## Tong quan

SOES hien duoc trien khai theo modular monolith:

```text
React/Vite SPA
    |
    | REST API + Socket.IO + WebRTC signaling
    v
Express/TypeScript Backend
    |
    +-- PostgreSQL / Prisma
    +-- Redis
    +-- Supabase Storage
    +-- MinIO
    +-- Gemini API
    +-- Judge0 CE
```

Backend va frontend khong nam trong `docker-compose.yml`; compose chi cung cap local infrastructure: PostgreSQL, Redis, MinIO va Judge0.

## Frontend

Thu muc chinh: `fe/soes-fe/src`.

Stack hien tai:

- React 19, React DOM 19.
- React Router 7.
- Vite 8, TypeScript 6.
- Tailwind CSS 4.
- TanStack Query 5.
- Zustand 5.
- Axios.
- Socket.IO Client.
- MediaPipe Tasks Vision cho face/phone monitoring assets.
- Monaco Editor cho cau hoi lap trinh.
- TinyMCE cho rich text editor.
- Recharts cho charts.

To chuc UI:

- `pages/admin`: hoc vu, users, final exam schedules, content, audit logs, monitoring, system settings.
- `pages/teacher`: course detail, question bank, AI generation, exam editor/detail, proctoring, grading, grade appeals.
- `pages/student`: dashboard, subjects, course detail, exams, take exam, result, notifications, settings.
- `router`: `GuestRoute`, `ProtectedRoute`, `RoleRoute`, `AppRouter`.
- `store`: auth va system settings.
- `api`: axios va socket client dung chung.

## Backend

Thu muc chinh: `be/soes-be/src`.

Stack hien tai:

- Express 5.
- TypeScript 6.
- Prisma 5 voi PostgreSQL.
- JWT access token, refresh token trong HttpOnly cookie.
- Redis cho refresh token store, token blacklist va live state.
- Zod validators.
- Socket.IO va Redis adapter.
- Supabase/MinIO storage clients.
- Gemini va Judge0 integration.

`src/app.ts` mount cac route chinh:

- `/api/auth`
- `/api/system-settings`
- `/api/student`
- `/api/student/course-offerings`
- `/api/admin`
- `/api/teacher`
- `/api/teacher/notifications`
- `/api/local-evidence`
- `/health`

Module backend chinh:

- `auth`: login, refresh token, logout, profile, password/profile update, role middleware.
- `admin-academic`: department, subject, semester, course offering.
- `admin-users`: users, enrollments, reset password, status.
- `admin-content`: shared question bank va exam tracking.
- `admin-audit-logs`: list/detail/export/overview audit log.
- `admin-monitoring`: monitoring/report overview.
- `admin-system-settings`: public/admin/teacher settings, logo, defaults, integration health.
- `teacher-courses`: course offerings, materials, posts, students, exams, gradebook, proctor assignments.
- `teacher-questions`: question CRUD, programming config/test cases, audit, archive/restore, share/remove bank, upload assets.
- `teacher-exams`: exam CRUD, schedule/makeup, lifecycle lock/unlock/visibility, submissions, grading, result release, proctoring.
- `exam-schedules`: admin final exam schedule routes.
- `ai-question-generation`: generation histories, material/source-file input, Gemini generation, review.
- `student-dashboard`, `student-subjects`, `student-course-detail`, `student-portal`, `student-take-exam`.
- `grade-appeals`: student appeal va teacher handling.
- `notifications`: teacher notifications.
- `proctoring`: Socket.IO realtime gateway.
- `proctoring-live`: live WebRTC session state/service.

Moi module thuong chia thanh `routes`, `controllers`, `services`, `repositories`, `validators`, `mappers`, `dtos` va `types` tuy nhu cau.

## Authentication and Authorization

Login dung `identifier` theo prefix:

- `SV...`: Student.
- `GV...`: Teacher.
- `AD...`: Admin.

Access token JWT chua `sub`, `profileId`, `role`, `jti`.

Refresh token:

- Tra ve qua HttpOnly cookie.
- Luu trong Redis theo `User.id`.
- TTL 7 ngay theo `auth.service.ts`.

Session rule hien tai:

- Student chi duoc mot active session de giam rui ro thi ho.
- Teacher va Admin co the dang nhap lai tu nhieu thiet bi.

Authorization:

- Backend dung `authenticate`, `requireRoles`, `requireAdmin`, `requireTeacher`, `requireStudent`.
- Frontend dung `RoleRoute` de chan route theo role.

## Database

Prisma schema nam tai `be/soes-be/prisma/schema.prisma`.

Domain chinh:

- Identity: `User`, `Student`, `Teacher`, `Admin`.
- Academic: `Department`, `Semester`, `Subject`, `CourseOffering`, `Enrollment`.
- Content: `Post`, `PostAttachment`, `Material`.
- Question bank: `QuestionBank`, `QuestionBankItem`, `Question`, options, programming config/test cases.
- AI: `AIGenerationHistory`, `AIGenerationMaterial`.
- Exam authoring: `Exam`, `ExamSection`, `ExamQuestion`, `ExamQuestionOption`, programming snapshots.
- Scheduling: `ExamSchedule`, `ExamScheduleCourse`, `ExamScheduleStudent`, `ExamScheduleProctor`.
- Attempts/grading: `ExamAttempt`, `ExamAttemptQuestion`, `StudentAnswer`, `ProgrammingSubmission`, `ProgrammingSubmissionTestResult`.
- Proctoring: `ExamSession`, `Violation`, `ViolationEvidence`.
- System: `Notification`, `AuditLog`, `CodeGenerationSetting`, `GradeAppeal`.

## Exam Lifecycle

`Exam` la noi dung de thi:

- `DRAFT`: dang soan.
- `READY`: san sang lap lich.
- `LOCKED`: da khoa distribution/chinh sua khi co lich hoac de bao toan noi dung.
- `ARCHIVED`: luu tru.

`ExamSchedule` la ca thi:

- `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `CANCELLED`.

Lich thi chua:

- Start/end/duration/max attempts/password.
- Flags proctoring: tab lock, fullscreen, webcam, screen monitoring, block copy/paste, block right click.
- Distribution mode.
- Result release mode, review policy.
- Target course/student va proctor assignments.
- Makeup relation qua `makeupOfScheduleId`.

## Realtime Proctoring

Socket.IO gateway: `src/modules/proctoring/proctoring-realtime.gateway.ts`.

Event group chinh:

- Join room: `proctoring:join_schedule`, `proctoring:join_attempt`.
- Live stream request: `live:request_camera`, `live:request_screen`.
- WebRTC signaling: `live:student_offer`, `live:teacher_answer`, `live:student_candidate`, `live:teacher_candidate`, `live:end`.
- Dashboard updates: heartbeat, online/offline, violation, attempt invalidation.

Redis duoc dung de luu live session state va ho tro nhieu backend instance.

## Storage

- Supabase Storage: course materials, question images, AI source files, system logo/assets.
- MinIO: proctoring evidence (`ViolationEvidence`) qua bucket cau hinh.
- Local fallback evidence: `/api/local-evidence`, chi Teacher/Admin duoc doc.
- PostgreSQL chi luu metadata/path/object key, khong luu binary file.

## Code Execution

Judge0 CE dung cho cau hoi `PROGRAMMING`:

- Student co the run code trong luc lam bai.
- Submit tao `ProgrammingSubmission`.
- Ket qua tung test case luu vao `ProgrammingSubmissionTestResult`.
- Ngon ngu ho tro: `JAVA`, `C`, `CPP`.

## AI Generation

Gemini duoc goi trong `ai-question-generation`.

Luon chinh:

1. Teacher chon course material hoac upload source file.
2. Backend doc/trich xuat noi dung.
3. Tao prompt theo target objective/programming va mode.
4. Goi Gemini.
5. Validate schema, normalize va review chat luong.
6. Luu `AIGenerationHistory`, source files/material links va `Question`.
7. Teacher review de dua vao question bank hoac exam.
