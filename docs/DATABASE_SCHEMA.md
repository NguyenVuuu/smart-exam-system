# Database Schema

Nguồn sự thật: `be/soes-be/prisma/schema.prisma`.

Tài liệu này mô tả schema nghiệp vụ hiện tại ở mức domain. Khi có khác biệt, ưu tiên Prisma schema.

## Quy ước chung

- Database: PostgreSQL.
- ORM: Prisma.
- Primary key hầu hết là UUID string.
- Timestamp dùng `DateTime`; Prisma/DB lưu theo UTC.
- Password được lưu ở bảng profile theo vai trò: `Student.password`, `Teacher.password`, `Admin.password`.
- `User` chứa thông tin cá nhân chung; từng vai trò có profile riêng.

## Identity

### User

Thông tin cá nhân chung: `email`, `phoneNumber`, `fullName`, `avatarUrl`.

Relation chính:

- `student`, `teacher`, `admin`
- `notifications`
- `auditLogs`
- các relation người tạo lịch thi, người invalidate attempt, người review/detect violation

### Student

Field chính: `studentCode`, `password`, `status`, `userId`.

Relation:

- `enrollments`
- `examAttempts`
- `targetExamSchedules`
- `gradeAppeals`

### Teacher

Field chính: `teacherCode`, `password`, `status`, `position`, `departmentId`, `userId`.

`position` có enum `LECTURER`, `DEPARTMENT_HEAD`.

Relation:

- course offerings phụ trách
- exams tạo ra
- posts/materials/questions
- AI generations
- question bank reviews/removals
- exam reviews
- handled grade appeals
- proctor assignments

### Admin

Field chính: `adminCode`, `password`, `status`, `userId`.

Relation tới question bank reviews/removals.

## Academic

### Department

Quản lý khoa/bộ môn: `code`, `name`, `description`, `status`.

Relation tới `Teacher` và `Subject`.

### Semester

Field chính:

- `code`, `name`, `academicYear`, `term`
- `startDate`, `endDate`
- `status`

Ràng buộc:

- `code` unique
- `(academicYear, term)` unique

### Subject

Field chính: `code`, `name`, `description`, `credits`, `status`, `departmentId`.

Relation tới course offerings, enrollments, questions, question bank, exams, AI generations.

### CourseOffering

Đại diện một lớp học phần: một môn học trong một học kỳ do một giảng viên phụ trách.

Field chính:

- `code`
- `semesterId`
- `subjectId`
- `teacherId`
- `maxCapacity`
- `status`

Relation tới enrollments, materials, posts, AI generations, exam schedule courses và attempts.

### Enrollment

Ràng buộc:

- `(courseOfferingId, studentId)` unique
- `(studentId, subjectId, semesterId)` unique

Điều này ngăn sinh viên ghi danh trùng một môn trong cùng học kỳ.

## Learning Content

### Post and PostAttachment

`Post` là bài đăng theo lớp học phần, có trạng thái `DRAFT`, `PUBLISHED`, `HIDDEN`, hỗ trợ pin và attachments.

`PostAttachment` unique theo `(postId, fileName)`.

### Material

Tài liệu học tập theo lớp học phần.

Field chính:

- `title`, `fileName`, `objectName`, `fileSize`, `contentType`, `storagePath`
- `checksum`, `storageProvider`
- `aiEnabled`
- `courseOfferingId`, `uploaderId`

Ràng buộc:

- `(courseOfferingId, fileName)` unique

Storage provider enum: `LOCAL`, `SUPABASE`, `MINIO`.

## Question Bank

### QuestionBank and QuestionBankItem

Mỗi `Subject` có tối đa một `QuestionBank`.

`QuestionBankItem` liên kết một `Question` vào bank:

- `status`: `PENDING`, `APPROVED`, `REJECTED`
- review/removal metadata
- `removedAt` dùng như soft remove khỏi bank

### Question

Field chính:

- `title`, `content`, `explanation`
- `type`: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `PROGRAMMING`
- `difficulty`: `EASY`, `MEDIUM`, `HARD`
- `source`: `MANUAL`, `AI_GENERATED`, `IMPORTED`
- `language`: `JAVA`, `C`, `CPP` cho câu lập trình
- `aiReviewStatus`
- `archivedAt`
- `ownerId`, `subjectId`, `aiGenerationId`

Relation:

- `options`
- `programmingConfig`
- `programmingTests`
- `examQuestions` snapshot từ question gốc
- `questionBankItem`

### QuestionOption

Ràng buộc `(questionId, orderIndex)` unique.

### QuestionProgrammingConfig

Giới hạn chạy code ở cấp question bank:

- `timeLimitMs`
- `memoryLimitKb`
- `maxCodeSizeKb`

### QuestionProgrammingTestCase

Field chính: `input`, `expectedOutput`, `isSample`, `isHidden`, `orderIndex`.

Ràng buộc `(questionId, orderIndex)` unique.

## AI Generation

### AIGenerationHistory

Lưu một lượt sinh/trích xuất câu hỏi bằng AI.

Field chính:

- `teacherId`, `subjectId`, `courseOfferingId`, `examId`
- `prompt`, `aiModel`
- `mode`: `GENERATE_FROM_MATERIAL`, `EXTRACT_EXISTING_EXAM`
- `sourceType`: `COURSE_MATERIAL`, `UPLOAD_FILE`
- metadata file nguồn đơn và `sourceFiles` JSON
- `questionCount`
- `status`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

### AIGenerationMaterial

Join table giữa `AIGenerationHistory` và `Material`.

## Exam Authoring

### Exam

`Exam` là đề thi/bộ câu hỏi. Lịch thi, thời gian, mật khẩu và cấu hình chống gian lận nằm ở `ExamSchedule`.

Field chính:

- `title`, `description`
- `subjectId`, `semesterId`, `createdById`
- `defaultDurationMinutes`
- `totalPoints`
- `format`: `OBJECTIVE`, `PROGRAMMING`, `MIXED`
- `status`: `DRAFT`, `READY`, `LOCKED`, `ARCHIVED`
- `studentVisibility`: `VISIBLE`, `HIDDEN`
- `approvalStatus`: `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED`
- `creationMethod`: `MANUAL`, `QUESTION_BANK`, `AI_GENERATED`, `MIXED`
- `type`: `QUIZ`, `MIDTERM`, `FINAL`

### ExamSection

Nhóm câu hỏi trong đề:

- `type`: `OBJECTIVE`, `PROGRAMMING`
- `targetPoints`
- `orderIndex`

Ràng buộc `(examId, orderIndex)` unique.

### ExamQuestion

Snapshot nội dung câu hỏi tại thời điểm thêm vào đề.

Field chính:

- `title`, `content`, `explanation`
- `type`, `difficulty`, `language`
- `points`, `orderIndex`
- `sourceQuestionId`
- `examId`, `sectionId`

Relation tới options snapshot, programming config/test cases snapshot, attempt questions, answers và submissions.

## Exam Scheduling

### ExamSchedule

`ExamSchedule` là ca thi/lịch thi cụ thể cho một `Exam`.

Field chính:

- `title`, `examId`
- `startTime`, `endTime`, `durationMinutes`
- `maxAttempts`
- `passwordHash`
- `enableTabLock`, `maxTabSwitches`
- `requireFullscreen`, `enableWebcam`, `enableScreenMonitoring`
- `blockCopyPaste`, `blockRightClick`
- `proctoringStoragePath`
- `locationMode`: `ONLINE`, `CAMPUS`
- `allowedIpRanges`
- `distributionMode`: `FIXED_ORDER`, `SHUFFLE_QUESTIONS`, `SHUFFLE_OPTIONS`, `SHUFFLE_QUESTIONS_AND_OPTIONS`, `RANDOM_SUBSET`
- `randomQuestionCount`
- `resultReleaseMode`: `IMMEDIATE`, `MANUAL`, `SCHEDULED`, `NEVER`
- `resultReleaseAt`, `resultsPublishedAt`
- `reviewPolicy`: `NONE`, `SCORE_ONLY`, `ANSWERS_NO_KEY`, `FULL_AFTER_RELEASE`
- `reviewStartAt`, `reviewEndAt`
- `status`: `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `CANCELLED`
- `publishedAt`, `cancelledAt`, `cancellationReason`
- `makeupOfScheduleId`
- `createdById`

### ExamScheduleCourse

Join giữa lịch thi và lớp học phần. Có relation `proctors`.

### ExamScheduleStudent

Danh sách sinh viên target trực tiếp cho lịch thi.

### ExamScheduleProctor

Phân công giám thị theo từng course trong schedule.

Ràng buộc `(examScheduleCourseId, teacherId)` unique.

## Attempt and Grading

### ExamAttempt

Field chính:

- `attemptNo`
- `startedAt`, `deadlineAt`, `submittedAt`, `lastSavedAt`
- `endedBy`: `STUDENT`, `TIMEOUT`, `SYSTEM`, `PROCTOR`
- `status`: `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `GRADING`, `GRADED`, `PUBLISHED`, `INVALIDATED`
- `totalScore`, `autoScore`, `manualScore`
- violation viewed metadata
- invalidation metadata
- `version`
- `examScheduleId`, `courseOfferingId`, `studentId`

Ràng buộc `(examScheduleId, studentId, attemptNo)` unique.

### ExamAttemptQuestion

Snapshot thứ tự câu hỏi cho từng attempt:

- `displayOrder`
- `shuffledOptionIds`

Ràng buộc:

- `(attemptId, examQuestionId)` unique
- `(attemptId, displayOrder)` unique

### StudentAnswer

Lưu câu trả lời hiện tại:

- `selectedOptionIds`
- `draftSourceCode`
- `score`
- `isCorrect`

Ràng buộc `(attemptId, examQuestionId)` unique.

### ProgrammingSubmission

Kết quả nộp/chấm code chính thức:

- `clientRequestId`
- `submissionNo`
- `sourceCode`
- `language`
- `status`
- score/test summary/runtime fields

Ràng buộc:

- `clientRequestId` unique
- `(attemptId, examQuestionId, submissionNo)` unique

### ProgrammingSubmissionTestResult

Kết quả từng test case của submission.

Ràng buộc `(submissionId, testCaseId)` unique.

## Proctoring

### ExamSession

Trạng thái runtime của attempt:

- `socketId`, `ipAddress`, `deviceInfo`
- `lastHeartbeat`, `isOnline`
- `webcamStatus`
- `screenShareStatus`
- heartbeat webcam/screen

`attemptId` unique.

### Violation

Field chính:

- `violationType`
- `source`: `WEBCAM`, `SCREEN`, `BROWSER`, `PROCTOR`
- `severity`
- `detectedBy`: `SYSTEM`, `PROCTOR`
- `reviewStatus`: `PENDING`, `REVIEWED`, `CONFIRMED`, `DISMISSED`, `WARNED`, `FORCE_SUBMITTED`, `INVALIDATED`
- `evidenceUrls` legacy JSON
- `metadata`
- timing/review fields

`ViolationType` hiện gồm: `TAB_SWITCH`, `FULLSCREEN_EXIT`, `NO_FACE`, `MULTIPLE_FACES`, `INACTIVITY`, `LOOKING_AWAY`, `PHONE_DETECTED`, `COPY_PASTE`, `RIGHT_CLICK`, `CAMERA_BLOCKED`, `CAMERA_DISCONNECTED`, `CAMERA_PERMISSION_DENIED`, `SCREEN_SHARE_STOPPED`, `SCREEN_PERMISSION_DENIED`, `PROCTOR_WEBCAM_CAPTURE`, `PROCTOR_SCREEN_CAPTURE`.

### ViolationEvidence

Metadata file bằng chứng:

- `evidenceType`: `WEBCAM_IMAGE`, `SCREEN_IMAGE`
- `storageProvider`, `bucket`, `objectName`, `storagePath`
- `fileName`, `contentType`, `fileSize`
- `capturedById`

Binary ảnh không lưu trong PostgreSQL.

## Grade Appeal

### GradeAppeal

Sinh viên chỉ có một phúc khảo cho mỗi attempt.

Field chính:

- `reason`
- `status`: `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`
- `teacherReply`
- `handledAt`
- `attemptId`, `studentId`, `handledById`

Ràng buộc `attemptId` unique.

## System

### Notification

Field: `title`, `content`, `link`, `isRead`, `userId`.

### AuditLog

Field: `action`, `entityType`, `entityId`, `metadata`, `userId`, `ipAddress`, `userAgent`.

### CodeGenerationSetting

Cấu hình prefix/digits sinh mã `student`, `teacher`, `admin`.
