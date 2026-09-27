# Database Schema

Nguon su that: `be/soes-be/prisma/schema.prisma`.

Tai lieu nay mo ta schema nghiep vu hien tai o muc domain. Khi co khac biet, uu tien Prisma schema.

## Quy uoc chung

- Database: PostgreSQL.
- ORM: Prisma.
- Primary key hau het la UUID string.
- Timestamp dung `DateTime`; ung dung/DB luu theo UTC.
- Password luu rieng tren profile vai tro: `Student.password`, `Teacher.password`, `Admin.password`.
- `User` chua thong tin ca nhan chung; moi vai tro co profile rieng.
- File binary khong luu truc tiep trong PostgreSQL; database chi luu metadata/path/object key.

## Identity

### User

Thong tin ca nhan chung: `email`, `phoneNumber`, `fullName`, `avatarUrl`.

Relation chinh:

- `student`, `teacher`, `admin`
- `notifications`, `auditLogs`
- nguoi tao schedule, nguoi invalidate attempt, nguoi xem/review/detect violation, nguoi chup evidence

### Student

Field chinh: `studentCode` unique, `password`, `status`, `userId` unique.

Relation: `enrollments`, `examAttempts`, `targetExamSchedules`, `gradeAppeals`.

### Teacher

Field chinh: `teacherCode` unique, `password`, `status`, `position`, `departmentId`, `userId` unique.

`position`: `LECTURER`, `DEPARTMENT_HEAD`.

Relation:

- course offerings phu trach
- exams tao ra/review
- posts, materials, questions
- AI generations
- question bank reviews/removals
- handled grade appeals
- proctor assignments

### Admin

Field chinh: `adminCode` unique, `password`, `status`, `userId` unique.

Relation toi question bank reviews/removals.

## Academic

### Department

Quan ly khoa/bo mon: `code` unique, `name`, `description`, `status`.

`status`: `ACTIVE`, `INACTIVE`.

### Semester

Field chinh:

- `code` unique
- `name`, `academicYear`
- `term`: `TERM_1`, `TERM_2`, `TERM_3`
- `startDate`, `endDate`
- `status`: `UPCOMING`, `ACTIVE`, `CLOSED`

Rang buoc: `(academicYear, term)` unique.

### Subject

Field chinh: `code` unique, `name`, `description`, `credits`, `status`, `departmentId`.

Relation toi course offerings, enrollments, questions, question bank, exams va AI generations.

### CourseOffering

Dai dien mot lop hoc phan: mot mon hoc trong mot hoc ky do mot teacher phu trach.

Field chinh: `code` unique, `status`, `semesterId`, `subjectId`, `teacherId`, `maxCapacity`.

`status`: `ACTIVE`, `CLOSED`.

Relation toi enrollments, materials, posts, AI generations, schedule courses va attempts.

### Enrollment

Rang buoc:

- `(courseOfferingId, studentId)` unique
- `(studentId, subjectId, semesterId)` unique

Rang buoc thu hai chan student hoc trung cung mon trong cung hoc ky.

## Learning Content

### Post

Bai dang theo course offering:

- `title`, `content`
- `status`: `DRAFT`, `PUBLISHED`, `HIDDEN`
- `isPinned`, `publishedAt`
- `courseOfferingId`, `createdById`

### PostAttachment

Attachment cua post: `fileName`, `objectName`, `fileSize`, `contentType`, `storagePath`.

Rang buoc: `(postId, fileName)` unique.

### Material

Tai lieu hoc tap theo course offering:

- `title`, `fileName`, `objectName`, `fileSize`, `contentType`, `storagePath`
- `checksum`
- `storageProvider`: `LOCAL`, `SUPABASE`, `MINIO`
- `aiEnabled`
- `courseOfferingId`, `uploaderId`

Rang buoc: `(courseOfferingId, fileName)` unique.

## Question Bank

### QuestionBank

Moi `Subject` co toi da mot `QuestionBank`.

### QuestionBankItem

Lien ket mot `Question` vao bank:

- `status`: `PENDING`, `APPROVED`, `REJECTED`
- metadata review boi Admin/Teacher
- metadata removal boi Admin/Teacher
- `removedAt` la soft remove khoi bank, khong xoa `Question`

Rang buoc: `questionId` unique.

### Question

Field chinh:

- `title`, `content`, `explanation`
- `type`: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `PROGRAMMING`
- `difficulty`: `EASY`, `MEDIUM`, `HARD`
- `aiDifficultyReason`
- `source`: `MANUAL`, `AI_GENERATED`, `IMPORTED`
- `language`: `JAVA`, `C`, `CPP` cho programming
- `aiReviewStatus`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`
- `archivedAt`
- `ownerId`, `subjectId`, `aiGenerationId`

Relation: `options`, `programmingConfig`, `programmingTests`, `examQuestions`, `questionBankItem`.

### QuestionOption

Rang buoc: `(questionId, orderIndex)` unique.

### QuestionProgrammingConfig

Config code cho question bank: `timeLimitMs`, `memoryLimitKb`, `maxCodeSizeKb`.

### QuestionProgrammingTestCase

Test case cua programming question: `input`, `expectedOutput`, `isSample`, `isHidden`, `orderIndex`.

Rang buoc: `(questionId, orderIndex)` unique.

## AI Generation

### AIGenerationHistory

Luu mot luot sinh/trich xuat cau hoi bang AI.

Field chinh:

- `teacherId`, `subjectId`, `courseOfferingId`, `examId`
- `prompt`, `aiModel`
- `mode`: `GENERATE_FROM_MATERIAL`, `EXTRACT_EXISTING_EXAM`
- `sourceType`: `COURSE_MATERIAL`, `UPLOAD_FILE`
- source file don: `sourceFileName`, `sourceFilePath`, `sourceFileSize`, `sourceMimeType`
- `sourceFiles` JSON cho nhieu file
- `questionCount`
- `status`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `errorMessage`, `completedAt`

### AIGenerationMaterial

Join table giua `AIGenerationHistory` va `Material`.

Rang buoc: `(historyId, materialId)` unique.

## Exam Authoring

### Exam

`Exam` la de thi/bo cau hoi. Lich thi, thoi gian, password, proctoring va result release nam o `ExamSchedule`.

Field chinh:

- `title`, `description`
- `subjectId`, `semesterId`, `createdById`
- `defaultDurationMinutes`
- `totalPoints`
- `format`: `OBJECTIVE`, `PROGRAMMING`, `MIXED`
- `status`: `DRAFT`, `READY`, `LOCKED`, `ARCHIVED`
- `studentVisibility`: `VISIBLE`, `HIDDEN`
- `approvalStatus`: `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED`
- `reviewedAt`, `reviewedById`, `rejectionReason`
- `creationMethod`: `MANUAL`, `QUESTION_BANK`, `AI_GENERATED`, `MIXED`
- `type`: `QUIZ`, `MIDTERM`, `FINAL`

### ExamSection

Nhom cau hoi trong exam: `title`, `description`, `type`, `targetPoints`, `orderIndex`.

`type`: `OBJECTIVE`, `PROGRAMMING`.

Rang buoc: `(examId, orderIndex)` unique.

### ExamQuestion

Snapshot noi dung question tai thoi diem them vao exam:

- `title`, `content`, `explanation`
- `type`, `difficulty`, `language`
- `points`, `orderIndex`
- `sourceQuestionId`
- `examId`, `sectionId`

Rang buoc: `(examId, orderIndex)` unique.

### ExamQuestionOption

Snapshot options cua `ExamQuestion`.

Rang buoc: `(examQuestionId, orderIndex)` unique.

### ProgrammingQuestionConfig va ProgrammingTestCase

Snapshot config/test cases o cap exam question, tach voi question bank de dam bao de thi da lap lich/cham diem khong bi doi theo question goc.

## Exam Scheduling

### ExamSchedule

`ExamSchedule` la ca thi/lap lich cu the cho mot `Exam`.

Field chinh:

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

### ExamScheduleStudent

Danh sach student target truc tiep cho schedule.

Rang buoc: `(examScheduleId, studentId)` unique.

### ExamScheduleCourse

Join giua schedule va course offering.

Rang buoc: `(examScheduleId, courseOfferingId)` unique.

### ExamScheduleProctor

Phan cong proctor theo schedule course.

Rang buoc: `(examScheduleCourseId, teacherId)` unique.

## Attempt and Grading

### ExamAttempt

Field chinh:

- `attemptNo`
- `startedAt`, `deadlineAt`, `submittedAt`, `lastSavedAt`
- `endedBy`: `STUDENT`, `TIMEOUT`, `SYSTEM`, `PROCTOR`
- `status`: `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `GRADING`, `GRADED`, `PUBLISHED`, `INVALIDATED`
- `totalScore`, `autoScore`, `manualScore`
- violation viewed metadata
- invalidation metadata
- `version`
- `examScheduleId`, `courseOfferingId`, `studentId`

Rang buoc: `(examScheduleId, studentId, attemptNo)` unique.

### GradeAppeal

Moi attempt chi co mot phuc khao.

Field chinh:

- `reason`
- `status`: `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`
- `teacherReply`
- `handledAt`
- `attemptId`, `studentId`, `handledById`

Rang buoc: `attemptId` unique.

### ExamAttemptQuestion

Snapshot thu tu cau hoi cho tung attempt:

- `displayOrder`
- `shuffledOptionIds`

Rang buoc:

- `(attemptId, examQuestionId)` unique
- `(attemptId, displayOrder)` unique

### StudentAnswer

Luu cau tra loi hien tai: `selectedOptionIds`, `draftSourceCode`, `score`, `isCorrect`.

Rang buoc: `(attemptId, examQuestionId)` unique.

### ProgrammingSubmission

Ket qua nop/cham code:

- `clientRequestId` unique
- `submissionNo`
- `sourceCode`
- `language`
- `status`
- score/test summary/runtime fields

Rang buoc: `(attemptId, examQuestionId, submissionNo)` unique.

### ProgrammingSubmissionTestResult

Ket qua tung test case cua submission.

Rang buoc: `(submissionId, testCaseId)` unique.

## Proctoring

### ExamSession

Trang thai runtime cua attempt:

- `socketId`, `ipAddress`, `deviceInfo`
- `lastHeartbeat`, `isOnline`
- `webcamStatus`: `NOT_REQUIRED`, `PENDING_PERMISSION`, `ACTIVE`, `DISCONNECTED`, `PERMISSION_DENIED`, `BLOCKED`
- `screenShareStatus`: `NOT_REQUIRED`, `PENDING_PERMISSION`, `ACTIVE`, `STOPPED`, `PERMISSION_DENIED`
- heartbeat webcam/screen

Rang buoc: `attemptId` unique.

### Violation

Field chinh:

- `violationType`
- `source`: `WEBCAM`, `SCREEN`, `BROWSER`, `PROCTOR`
- `severity`: `LOW`, `MEDIUM`, `HIGH`
- `detectedBy`: `SYSTEM`, `PROCTOR`
- `reviewStatus`: `PENDING`, `REVIEWED`, `CONFIRMED`, `DISMISSED`, `WARNED`, `FORCE_SUBMITTED`, `INVALIDATED`
- `evidenceUrls` legacy JSON
- `metadata`
- timing/review fields
- `attemptId`, `detectedById`, `reviewedById`

`ViolationType` hien gom: `TAB_SWITCH`, `FULLSCREEN_EXIT`, `NO_FACE`, `MULTIPLE_FACES`, `INACTIVITY`, `LOOKING_AWAY`, `PHONE_DETECTED`, `COPY_PASTE`, `RIGHT_CLICK`, `CAMERA_BLOCKED`, `CAMERA_DISCONNECTED`, `CAMERA_PERMISSION_DENIED`, `SCREEN_SHARE_STOPPED`, `SCREEN_PERMISSION_DENIED`, `PROCTOR_WEBCAM_CAPTURE`, `PROCTOR_SCREEN_CAPTURE`.

### ViolationEvidence

Metadata file evidence:

- `evidenceType`: `WEBCAM_IMAGE`, `SCREEN_IMAGE`
- `storageProvider`, `bucket`, `objectName`, `storagePath`
- `fileName`, `contentType`, `fileSize`
- `capturedById`

## System

### Notification

Field: `title`, `content`, `link`, `isRead`, `userId`.

### AuditLog

Field: `action`, `entityType`, `entityId`, `metadata`, `userId`, `ipAddress`, `userAgent`.

### CodeGenerationSetting

Cau hinh prefix/digits sinh ma: `studentPrefix`, `studentDigits`, `teacherPrefix`, `teacherDigits`, `adminPrefix`, `adminDigits`.
