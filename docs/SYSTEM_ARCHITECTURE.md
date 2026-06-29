# SYSTEM ARCHITECTURE

# 1. Tổng quan

SOES (Smart Online Examination System) áp dụng kiến trúc **Modular Monolith**.

Hệ thống được chia thành nhiều module độc lập nhưng được triển khai dưới dạng một ứng dụng backend duy nhất.

Kiến trúc này mang lại:

- Dễ phát triển đối với nhóm nhỏ.
- Dễ triển khai và bảo trì.
- Giảm độ phức tạp so với Microservices.
- Tách biệt rõ trách nhiệm giữa các module.
- Dễ mở rộng trong tương lai.

---

# 2. Kiến trúc tổng thể

```text
+------------------------------------------------------+
|                      Frontend                        |
|                                                      |
|         React + Vite + TypeScript + Tailwind        |
+---------------------------+--------------------------+
                            |
                            | REST API / WebSocket
                            |
+------------------------------------------------------+
|                      Backend                         |
|                                                      |
|            Node.js + Express + TypeScript           |
|                                                      |
| +--------------+ +-------------+ +---------------+ |
| | Auth Module  | | User Module | | Academic     | |
| |              | |             | | Module       | |
| +--------------+ +-------------+ +---------------+ |
|                                                      |
| +--------------+ +-------------+ +---------------+ |
| | Material     | | Question    | | Examination  | |
| | Module       | | Module      | | Module       | |
| +--------------+ +-------------+ +---------------+ |
|                                                      |
| +--------------+ +-------------+ +---------------+ |
| | Submission   | | Grading     | | Notification | |
| | Module       | | Module      | | Module       | |
| +--------------+ +-------------+ +---------------+ |
|                                                      |
| +--------------+ +-------------+ +---------------+ |
| | Proctoring   | | AI Module   | | Audit Module | |
| | Module       | |             | |              | |
| +--------------+ +-------------+ +---------------+ |
+------------------------------------------------------+
                            |
                            |
+------------------------------------------------------+
|                   Infrastructure                     |
|                                                      |
| PostgreSQL                                           |
| Redis                                                |
| MinIO                                                |
| Gemini API                                           |
| Judge0 CE                                            |
+------------------------------------------------------+
```

---

# 3. Frontend Architecture

## Công nghệ sử dụng

- React
- Vite
- TypeScript
- TailwindCSS
- Shadcn UI
- Axios
- TanStack Query (React Query)
- Zustand
- Socket.IO Client

---

## Cấu trúc thư mục đề xuất

```text
src/
├── assets/
├── components/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── stores/
├── types/
├── utils/
├── constants/
├── App.tsx
└── main.tsx
```

Kiến trúc Frontend theo hướng **Feature-based**.

Ví dụ:

```text
features/
├── auth/
├── users/
├── semesters/
├── subjects/
├── courses/
├── materials/
├── questions/
├── exams/
├── submissions/
├── grades/
├── notifications/
└── proctoring/
```

---

# 4. Backend Architecture

## Công nghệ sử dụng

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT Authentication
- Socket.IO

---

## Cấu trúc thư mục đề xuất

```text
src/
├── config/
├── modules/
├── middlewares/
├── routes/
├── services/
├── repositories/
├── sockets/
├── utils/
├── jobs/
├── prisma/
├── types/
├── app.ts
└── server.ts
```

Mỗi module nên được tổ chức theo cấu trúc:

```text
modules/
└── auth/
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── auth.repository.ts
    ├── auth.validation.ts
    ├── auth.routes.ts
    └── auth.types.ts
```

---

# 5. Core Modules

# 5.1 Authentication Module

Chức năng:

- Đăng nhập.
- Đăng xuất.
- Quản lý JWT.
- Refresh Token.
- Quản lý phiên đăng nhập.
- Ngăn đăng nhập trên nhiều thiết bị.
- Đổi mật khẩu.

Entity chính:

- User
- RefreshToken

---

# 5.2 User Module

Chức năng:

- Quản lý người dùng.
- Quản lý giảng viên.
- Quản lý sinh viên.
- Quản lý hồ sơ cá nhân.

Entity chính:

- User

---

# 5.3 Academic Module

Chức năng:

- Quản lý học kỳ.
- Quản lý môn học.
- Quản lý lớp học phần.
- Quản lý danh sách sinh viên trong lớp.

Entity chính:

- Semester
- Subject
- CourseOffering
- Enrollment

---

# 5.4 Material Module

Chức năng:

- Tải lên tài liệu.
- Xóa tài liệu.
- Tải xuống tài liệu.
- Chọn tài liệu để AI xử lý.

Định dạng hỗ trợ:

- PDF
- DOCX
- PPTX

Entity chính:

- Material

Lưu trữ:

- MinIO

---

# 5.5 Question Module

Chức năng:

- Tạo câu hỏi.
- Chỉnh sửa câu hỏi.
- Xóa câu hỏi.
- Quản lý ngân hàng câu hỏi.
- Quản lý câu hỏi do AI tạo.

Loại câu hỏi:

- Single Choice
- Multiple Choice
- Programming

Entity chính:

- Question
- AnswerOption
- TestCase

---

# 5.6 AI Module

Chức năng:

- Trích xuất nội dung tài liệu.
- Sinh câu hỏi bằng AI.
- Sinh đáp án nhiễu.
- Hỗ trợ tạo đề thi.

Nhà cung cấp AI:

- Gemini API

Luồng xử lý:

```text
Giảng viên chọn tài liệu
            ↓
Trích xuất nội dung
            ↓
Gửi Prompt tới Gemini
            ↓
Nhận câu hỏi
            ↓
Giảng viên kiểm tra
            ↓
Lưu vào ngân hàng hoặc đề thi
```

---

# 5.7 Examination Module

Chức năng:

- Tạo đề thi.
- Công bố đề thi.
- Đóng đề thi.
- Xáo trộn câu hỏi.
- Quản lý phiên thi.

Trạng thái đề thi:

- DRAFT
- PUBLISHED
- CLOSED

Entity chính:

- Exam
- ExamQuestion
- ExamSession

---

# 5.8 Submission Module

Chức năng:

- Lưu đáp án.
- Tự động lưu bài làm.
- Nộp bài.
- Khôi phục phiên làm bài.

Entity chính:

- Submission
- SubmissionAnswer

---

# 5.9 Programming Module

Chức năng:

- Nhận mã nguồn.
- Chạy mã nguồn.
- Chạy Test Case.
- Trả kết quả thực thi.

Ngôn ngữ hỗ trợ:

- Java
- C
- C++

Giải pháp sử dụng:

- Judge0 CE

Luồng xử lý:

```text
Sinh viên nộp mã nguồn
              ↓
Backend gửi tới Judge0
              ↓
Judge0 biên dịch và chạy
              ↓
So sánh Output
              ↓
Tính điểm
              ↓
Lưu kết quả
```

---

# 5.10 Grading Module

Chức năng:

- Chấm điểm tự động.
- Chấm điểm thủ công.
- Ghi đè điểm.
- Công bố điểm.
- Xuất bảng điểm.

Entity chính:

- Grade

---

# 5.11 Proctoring Module

Chức năng:

- Giám sát trình duyệt.
- Giám sát webcam.
- Phát hiện hành vi đáng ngờ.
- Lưu bằng chứng vi phạm.

---

## Công nghệ sử dụng

### Browser Monitoring

- Browser Events API
- Fullscreen API
- Visibility API

Theo dõi:

- Chuyển tab.
- Thoát fullscreen.
- Mất focus.
- Không hoạt động.

### Webcam Monitoring

- WebRTC (`navigator.mediaDevices.getUserMedia`)
- MediaPipe Face Detection

Theo dõi:

- Không phát hiện khuôn mặt.
- Phát hiện nhiều khuôn mặt.

Khi phát hiện vi phạm:

```text
MediaPipe phát hiện bất thường
                ↓
Chụp ảnh webcam
                ↓
Gửi ảnh về Backend
                ↓
Lưu MinIO
                ↓
Ghi log vi phạm
                ↓
Thông báo realtime cho giảng viên
```

Entity chính:

- Violation
- ViolationEvidence

Giao tiếp thời gian thực:

- Socket.IO

---

# 5.12 Notification Module

Chức năng:

- Thông báo kỳ thi.
- Thông báo nộp bài.
- Thông báo vi phạm.

Phương thức:

- In-app Notification
- Realtime Notification

Entity chính:

- Notification

---

# 5.13 Audit Module

Chức năng:

- Ghi nhận hoạt động hệ thống.
- Lưu nhật ký bảo mật.
- Hỗ trợ kiểm tra và truy vết.

Ví dụ:

- Đăng nhập.
- Tải tài liệu.
- Tạo đề thi.
- Chỉnh sửa điểm.
- Ghi nhận vi phạm.

Entity chính:

- AuditLog

---

# 6. Database Layer

## Công nghệ

- PostgreSQL

## ORM

- Prisma ORM

Dữ liệu lưu trữ:

- Người dùng.
- Học vụ.
- Kỳ thi.
- Bài làm.
- Điểm số.
- Vi phạm.

---

# 7. Cache Layer

## Công nghệ

- Redis

Chức năng:

- Cache dữ liệu.
- Lưu session tạm thời.
- Lưu Refresh Token.
- Tăng hiệu năng hệ thống.

---

# 8. Storage Layer

## Công nghệ

- MinIO

Dùng để lưu:

- Tài liệu học tập.
- Ảnh vi phạm từ webcam.
- Tệp xuất báo cáo.

---

# 9. Realtime Communication

## Công nghệ

- Socket.IO

Dùng cho:

- Giám sát thi thời gian thực.
- Dashboard giảng viên.
- Thông báo realtime.
- Đồng bộ trạng thái bài thi.

---

# 10. External Integrations

## Gemini API

Mục đích:

- Sinh câu hỏi bằng AI.

---

## Judge0 CE

Mục đích:

- Biên dịch và chạy chương trình.
- Chấm điểm bài lập trình.

---

# 11. Security Architecture

Các cơ chế bảo mật:

- JWT Authentication.
- Refresh Token Rotation.
- Role-Based Access Control (RBAC).
- Mã hóa mật khẩu bằng Argon2.
- Input Validation.
- Rate Limiting.
- CORS.
- Helmet Security Headers.

---

# 12. Deployment Architecture

## Môi trường phát triển

Sử dụng Docker Compose:

```text
services:
- frontend
- backend
- postgres
- redis
- minio
- judge0
```

---

## Môi trường triển khai

```text
Frontend (React + Vite)
            ↓
Vercel

Backend (Express.js)
            ↓
Railway / Render

Database
            ↓
Neon PostgreSQL

Redis
            ↓
Upstash Redis

Object Storage
            ↓
MinIO
```
