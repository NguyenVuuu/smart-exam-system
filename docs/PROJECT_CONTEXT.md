# SOES - Smart Online Examination System

## 1. Tong quan du an

SOES la nen tang thi truc tuyen cho moi truong giao duc, tap trung vao quan ly hoc vu, ngan hang cau hoi, tao de thi, lap lich thi, lam bai, cham diem, giam sat chong gian lan va cong bo ket qua.

Codebase hien tai gom:

- Backend Express/TypeScript theo modular monolith.
- Frontend React/Vite theo feature-based UI cho Admin, Teacher va Student.
- PostgreSQL/Prisma lam nguon du lieu chinh.
- Redis cho refresh token, blacklist token va trang thai realtime.
- Socket.IO cho realtime proctoring va WebRTC signaling.
- Gemini cho AI question generation.
- Judge0 CE cho cham bai lap trinh.
- Supabase Storage cho course materials, question images, AI source files va system assets.
- MinIO cho proctoring evidence.

## 2. Doi tuong su dung

### Admin

Admin quan tri he thong va hoc vu:

- Quan ly khoa/bo mon, hoc ky, mon hoc, lop hoc phan.
- Quan ly user, tai khoan theo vai tro, ghi danh sinh vien.
- Quan ly lich thi tap trung, dac biet final exam.
- Theo doi shared question bank, exam tracking, audit logs va monitoring.
- Cau hinh he thong, logo, defaults, tich hop va code generation settings.

### Teacher

Teacher to chuc day hoc va danh gia:

- Quan ly cac lop hoc phan minh phu trach.
- Dang bai viet, tai lieu hoc tap va attachments.
- Tao va quan ly cau hoi ca nhan, chia se cau hoi vao ngan hang cau hoi mon hoc.
- Tao de thi, section, cau hoi snapshot, lap lich thi quiz/midterm.
- Sinh cau hoi bang AI tu course material hoac file upload.
- Giam sat realtime, xem/cap nhat vi pham, chup bang chung thu cong.
- Cham diem, finalize diem, cong bo ket qua, xu ly phuc khao.

Teacher co `position`: `LECTURER` hoac `DEPARTMENT_HEAD`. `DEPARTMENT_HEAD` co them mot so permission quan tri hoc vu/duyet cau hoi tuy theo mapper auth.

### Student

Student su dung cong thong tin hoc tap va lam bai:

- Xem dashboard, mon/lop dang hoc, timeline, bai viet, tai lieu, thanh vien.
- Xem lich thi, chi tiet ky thi va dieu kien vao thi.
- Lam bai trac nghiem/lap trinh, autosave, submit, run code.
- Gui heartbeat webcam/screen, ghi nhan vi pham phia client.
- Xem ket qua khi thoa chinh sach cong bo diem.
- Tao phuc khao diem cho attempt da co ket qua.

## 3. Chuc nang chinh

### Hoc vu va lop hoc phan

- `Department`, `Semester`, `Subject`, `CourseOffering`, `Enrollment`.
- Course offering dai dien cho mot mon hoc trong mot hoc ky do mot teacher phu trach.
- Sinh vien khong tu dang ky lop; Admin quan ly enrollment.
- He thong chan ghi danh trung cung mon trong cung hoc ky qua unique `(studentId, subjectId, semesterId)`.

### Noi dung hoc tap

- `Post` theo lop hoc phan, co `DRAFT`, `PUBLISHED`, `HIDDEN`, pin va attachments.
- `Material` theo lop hoc phan, unique file name trong tung course offering.
- Storage provider ho tro `LOCAL`, `SUPABASE`, `MINIO`; tai lieu hoc tap hien dung Supabase.

### Ngan hang cau hoi

- Question type: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `PROGRAMMING`.
- Difficulty: `EASY`, `MEDIUM`, `HARD`.
- Source: `MANUAL`, `AI_GENERATED`, `IMPORTED`.
- Cau hoi lap trinh co language `JAVA`, `C`, `CPP`, config time/memory/code size va test cases.
- Cau hoi co the archived, va co the duoc dua vao `QuestionBankItem` voi trang thai `PENDING`, `APPROVED`, `REJECTED`.

### AI question generation

AI module ho tro:

- `GENERATE_FROM_MATERIAL`: sinh cau hoi tu course material.
- `EXTRACT_EXISTING_EXAM`: trich xuat cau hoi tu file de thi upload.
- Source type: `COURSE_MATERIAL`, `UPLOAD_FILE`.
- Target: objective (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`) hoac `PROGRAMMING`.

Ket qua duoc validate/normalize, luu vao `AIGenerationHistory`, lien ket material/source files va tao question de teacher review/trien khai tiep.

### De thi va lich thi

Code hien tai tach ro:

- `Exam`: de thi/bo cau hoi, section, snapshot cau hoi, format, type va lifecycle noi dung.
- `ExamSchedule`: ca thi/lap lich cu the, thoi gian, password, proctoring flags, distribution, result release, review policy, target course/student va proctor.

`Exam.type`: `QUIZ`, `MIDTERM`, `FINAL`.

`Exam.status`: `DRAFT`, `READY`, `LOCKED`, `ARCHIVED`.

`ExamSchedule.status`: `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `CANCELLED`.

Teacher tao/lap lich regular exam khong phai final. Final exam duoc lap lich tap trung tu Admin. Teacher co the tao makeup schedule cho schedule duoc phep.

### Lam bai va cham diem

- `ExamAttempt` theo schedule/student/attempt number.
- Cau hoi trong attempt duoc snapshot thu tu tai `ExamAttemptQuestion`, co `shuffledOptionIds`.
- `StudentAnswer` luu dap an/draft source code hien tai.
- `ProgrammingSubmission` luu lan nop code chinh thuc va `ProgrammingSubmissionTestResult`.
- Objective questions va programming submissions duoc cham tu dong; teacher co the manual grade/finalize.
- Attempt co the bi `INVALIDATED` khi proctor/teacher xu ly vi pham.

### Cong bo ket qua va xem lai

Ket qua duoc quan ly tren `ExamSchedule`:

- `resultReleaseMode`: `IMMEDIATE`, `MANUAL`, `SCHEDULED`, `NEVER` trong schema.
- API teacher hien cho phep cap nhat `IMMEDIATE`, `MANUAL`, `SCHEDULED`.
- `resultsPublishedAt` danh dau da cong bo.
- `reviewPolicy`: `NONE`, `SCORE_ONLY`, `ANSWERS_NO_KEY`, `FULL_AFTER_RELEASE`.

Student chi thay diem/noi dung review khi attempt va schedule thoa policy cong bo.

### Proctoring

He thong theo doi:

- Browser: tab switch, fullscreen exit, inactivity, copy/paste, right click.
- Webcam: no face, multiple faces, looking away, phone detected, camera blocked/disconnected/permission denied.
- Screen share: stopped, permission denied.
- Proctor manual capture: webcam/screen evidence.

Realtime dung Socket.IO va WebRTC signaling. Evidence luu metadata trong DB va file trong MinIO, fallback local evidence co endpoint `/api/local-evidence` cho Teacher/Admin.

### Notification, audit va phuc khao

- `Notification` cho user, co link va read state.
- `AuditLog` ghi action/entity/metadata/ip/userAgent.
- `GradeAppeal` moi attempt chi co mot phuc khao; Teacher xu ly `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`.

## 4. Cong nghe hien tai

Frontend:

- React 19, React Router 7, Vite 8, TypeScript 6.
- Tailwind CSS 4, lucide-react, recharts, sonner.
- TanStack Query, Zustand, Axios, Socket.IO Client.
- MediaPipe Tasks Vision, Monaco Editor, TinyMCE.
- Playwright cho browser vision tests.

Backend:

- Node.js, Express 5, TypeScript 6, Prisma 5.
- JWT, bcrypt, cookie-parser, CORS.
- Zod validation.
- Socket.IO va Socket.IO Redis adapter.
- ioredis.
- Supabase JS, MinIO client.
- Gemini SDK `@google/genai`.

Infrastructure local:

- `docker-compose.yml` chay PostgreSQL, Redis, MinIO, Judge0 DB/server/workers.
- Frontend va backend chay rieng bang `npm run dev` trong tung thu muc.

## 5. Kien truc

- Backend: modular monolith, moi module gom routes/controllers/services/repositories/validators/mappers/dtos khi can.
- Frontend: feature-based theo `pages/admin`, `pages/teacher`, `pages/student`, dung router role guard.
- Giao tiep: REST API cho nghiep vu, Socket.IO/WebRTC cho realtime proctoring.
- Nguon su that schema: `be/soes-be/prisma/schema.prisma`.
