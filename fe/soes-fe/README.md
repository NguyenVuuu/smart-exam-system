# SOES Frontend

Frontend của SOES là ứng dụng React/Vite cho ba khu vực chức năng: Admin, Teacher và Student.

## Công nghệ

- React 19, React Router 7
- Vite 8, TypeScript 6
- Tailwind CSS 4
- TanStack Query, Zustand, Axios
- Socket.IO Client cho realtime proctoring
- MediaPipe Tasks Vision cho kiểm tra webcam
- Monaco Editor cho câu hỏi lập trình
- TinyMCE cho rich text editor

## Cấu trúc chính

```text
src/
├── auth              # hooks đăng nhập, khởi tạo phiên, logout
├── components        # component dùng chung
├── constants         # hằng số dùng chung
├── pages
│   ├── admin         # dashboard, học vụ, users, lịch thi, reports, settings
│   ├── auth          # login/admin login
│   ├── student       # dashboard, lớp học phần, bài thi, điểm, làm bài
│   └── teacher       # lớp học, ngân hàng câu hỏi, đề thi, coi thi, chấm điểm
├── router            # AppRouter, RoleRoute, ProtectedRoute, GuestRoute
├── store             # auth/system settings stores
└── utils
```

## Routes hiện có

Admin:

- `/admin`
- `/admin/academic`
- `/admin/academic-structure`
- `/admin/class-sections`
- `/admin/users`
- `/admin/shared-question-bank`
- `/admin/exams`
- `/admin/exam-schedules`
- `/admin/proctoring`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/settings`

Teacher:

- `/teacher`
- `/teacher/courses`
- `/teacher/account`
- `/teacher/courses/:courseOfferingId`
- `/teacher/question-bank`
- `/teacher/question-bank/ai-generator`
- `/teacher/question-audit`
- `/teacher/exams`
- `/teacher/exams/create`
- `/teacher/exams/auto-generator`
- `/teacher/exams/:examId`
- `/teacher/exams/:examId/edit`
- `/teacher/invigilation-schedule`
- `/teacher/department-approvals`
- `/teacher/proctoring`
- `/teacher/grading-reports`
- `/teacher/grading-reports/appeals/:appealId`

Student:

- `/student`
- `/student/subjects`
- `/student/exams`
- `/student/scores`
- `/student/notifications`
- `/student/settings`
- `/student/course-offerings/:courseOfferingId`
- `/student/course-offerings/:courseOfferingId/posts/:postId`
- `/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId`
- `/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId/take`
- `/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId/result`

## Chạy local

```bash
npm install
cp .env.example .env
npm run dev
```

`.env.example` hiện chỉ cần:

```text
VITE_API_URL=http://localhost:3000/api
```

## Scripts

- `npm run dev`: đồng bộ asset MediaPipe rồi chạy Vite.
- `npm run build`: đồng bộ asset, type-check và build.
- `npm run lint`: lint toàn bộ frontend.
- `npm run test:vision`: test worker vision bằng Node test runner.
- `npm run test:vision:browser`: test browser bằng Playwright.
