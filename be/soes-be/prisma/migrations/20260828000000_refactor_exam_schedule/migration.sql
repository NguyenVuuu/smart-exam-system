BEGIN;

-- New domain enums
CREATE TYPE "SemesterTerm" AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');
CREATE TYPE "ExamFormat" AS ENUM ('OBJECTIVE', 'PROGRAMMING', 'MIXED');
CREATE TYPE "ExamDistributionMode" AS ENUM ('FIXED_ORDER', 'SHUFFLE_QUESTIONS', 'SHUFFLE_OPTIONS', 'SHUFFLE_QUESTIONS_AND_OPTIONS', 'RANDOM_SUBSET');
CREATE TYPE "ResultReleaseMode" AS ENUM ('IMMEDIATE', 'MANUAL', 'SCHEDULED', 'NEVER');
CREATE TYPE "ReviewPolicy" AS ENUM ('NONE', 'SCORE_ONLY', 'ANSWERS_NO_KEY', 'FULL_AFTER_RELEASE');
CREATE TYPE "ExamLocationMode" AS ENUM ('ONLINE', 'CAMPUS');
CREATE TYPE "ExamScheduleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED');
ALTER TYPE "QuestionType" ADD VALUE 'TRUE_FALSE';

-- Academic metadata is added nullable first so existing rows can be backfilled.
ALTER TABLE "Semester"
  ADD COLUMN "academicYear" TEXT,
  ADD COLUMN "code" TEXT,
  ADD COLUMN "term" "SemesterTerm";

UPDATE "Semester"
SET
  "academicYear" = COALESCE(REPLACE(SUBSTRING("name" FROM '([0-9]{4}/[0-9]{4})'), '/', '-'), 'UNKNOWN'),
  "term" = CASE
    WHEN "name" ILIKE '%học kỳ 1%' THEN 'TERM_1'::"SemesterTerm"
    WHEN "name" ILIKE '%học kỳ 2%' THEN 'TERM_2'::"SemesterTerm"
    ELSE 'TERM_3'::"SemesterTerm"
  END;

UPDATE "Semester"
SET "code" = CASE "term"
  WHEN 'TERM_1' THEN 'HK1_' || REPLACE("academicYear", '-', '_')
  WHEN 'TERM_2' THEN 'HK2_' || REPLACE("academicYear", '-', '_')
  ELSE 'HK3_' || REPLACE("academicYear", '-', '_')
END;

ALTER TABLE "Semester"
  ALTER COLUMN "academicYear" SET NOT NULL,
  ALTER COLUMN "code" SET NOT NULL,
  ALTER COLUMN "term" SET NOT NULL;

ALTER TABLE "Subject"
  ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 3,
  ALTER COLUMN "departmentId" SET NOT NULL;

ALTER TABLE "CourseOffering"
  ADD COLUMN "maxCapacity" INTEGER NOT NULL DEFAULT 50;

-- Exam content fields are backfilled from the legacy combined Exam record.
ALTER TABLE "Exam"
  ADD COLUMN "defaultDurationMinutes" INTEGER,
  ADD COLUMN "format" "ExamFormat",
  ADD COLUMN "subjectId" TEXT,
  ADD COLUMN "totalPoints" DECIMAL(5,2) NOT NULL DEFAULT 10;

UPDATE "Exam" e
SET
  "subjectId" = co."subjectId",
  "defaultDurationMinutes" = e."durationMinutes",
  "format" = CASE
    WHEN EXISTS (
      SELECT 1 FROM "ExamQuestion" eq
      WHERE eq."examId" = e."id" AND eq."type" = 'PROGRAMMING'
    ) AND EXISTS (
      SELECT 1 FROM "ExamQuestion" eq
      WHERE eq."examId" = e."id" AND eq."type" <> 'PROGRAMMING'
    ) THEN 'MIXED'::"ExamFormat"
    WHEN EXISTS (
      SELECT 1 FROM "ExamQuestion" eq
      WHERE eq."examId" = e."id" AND eq."type" = 'PROGRAMMING'
    ) THEN 'PROGRAMMING'::"ExamFormat"
    ELSE 'OBJECTIVE'::"ExamFormat"
  END,
  "totalPoints" = COALESCE((
    SELECT SUM(eq."points") FROM "ExamQuestion" eq WHERE eq."examId" = e."id"
  ), 10)
FROM "CourseOffering" co
WHERE co."id" = e."courseOfferingId";

ALTER TABLE "Exam"
  ALTER COLUMN "defaultDurationMinutes" SET NOT NULL,
  ALTER COLUMN "format" SET NOT NULL,
  ALTER COLUMN "subjectId" SET NOT NULL;

-- Schedule tables become the single source of timing, access and proctoring configuration.
CREATE TABLE "ExamSchedule" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "passwordHash" TEXT,
  "enableTabLock" BOOLEAN NOT NULL DEFAULT true,
  "maxTabSwitches" INTEGER,
  "requireFullscreen" BOOLEAN NOT NULL DEFAULT false,
  "enableWebcam" BOOLEAN NOT NULL DEFAULT false,
  "blockCopyPaste" BOOLEAN NOT NULL DEFAULT true,
  "blockRightClick" BOOLEAN NOT NULL DEFAULT true,
  "locationMode" "ExamLocationMode" NOT NULL DEFAULT 'ONLINE',
  "allowedIpRanges" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "distributionMode" "ExamDistributionMode" NOT NULL DEFAULT 'FIXED_ORDER',
  "randomQuestionCount" INTEGER,
  "resultReleaseMode" "ResultReleaseMode" NOT NULL DEFAULT 'MANUAL',
  "resultReleaseAt" TIMESTAMP(3),
  "resultsPublishedAt" TIMESTAMP(3),
  "reviewPolicy" "ReviewPolicy" NOT NULL DEFAULT 'NONE',
  "reviewStartAt" TIMESTAMP(3),
  "reviewEndAt" TIMESTAMP(3),
  "status" "ExamScheduleStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamScheduleCourse" (
  "id" TEXT NOT NULL,
  "examScheduleId" TEXT NOT NULL,
  "courseOfferingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamScheduleCourse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamScheduleProctor" (
  "id" TEXT NOT NULL,
  "examScheduleCourseId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamScheduleProctor_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ExamSchedule" (
  "id", "title", "examId", "startTime", "endTime", "durationMinutes", "maxAttempts",
  "requireFullscreen", "enableWebcam", "blockCopyPaste", "blockRightClick",
  "distributionMode", "resultReleaseMode", "resultsPublishedAt", "reviewPolicy",
  "status", "publishedAt", "createdById", "createdAt", "updatedAt"
)
SELECT
  'schedule-' || e."id",
  e."title",
  e."id",
  e."startTime",
  e."endTime",
  e."durationMinutes",
  e."maxAttempts",
  e."requireFullscreen",
  e."enableWebcam",
  e."blockCopyPaste",
  e."blockRightClick",
  CASE
    WHEN e."shuffleQuestions" AND e."shuffleOptions" THEN 'SHUFFLE_QUESTIONS_AND_OPTIONS'::"ExamDistributionMode"
    WHEN e."shuffleQuestions" THEN 'SHUFFLE_QUESTIONS'::"ExamDistributionMode"
    WHEN e."shuffleOptions" THEN 'SHUFFLE_OPTIONS'::"ExamDistributionMode"
    ELSE 'FIXED_ORDER'::"ExamDistributionMode"
  END,
  CASE WHEN e."showResultImmediately" THEN 'IMMEDIATE'::"ResultReleaseMode" ELSE 'MANUAL'::"ResultReleaseMode" END,
  e."resultPublishedAt",
  CASE WHEN e."resultPublished" THEN 'SCORE_ONLY'::"ReviewPolicy" ELSE 'NONE'::"ReviewPolicy" END,
  CASE
    WHEN e."status" = 'DRAFT' THEN 'DRAFT'::"ExamScheduleStatus"
    WHEN e."status" = 'PUBLISHED' THEN 'SCHEDULED'::"ExamScheduleStatus"
    ELSE 'CLOSED'::"ExamScheduleStatus"
  END,
  e."publishedAt",
  t."userId",
  e."createdAt",
  e."updatedAt"
FROM "Exam" e
JOIN "Teacher" t ON t."id" = e."createdById";

INSERT INTO "ExamScheduleCourse" ("id", "examScheduleId", "courseOfferingId", "createdAt")
SELECT 'schedule-course-' || e."id", 'schedule-' || e."id", e."courseOfferingId", e."createdAt"
FROM "Exam" e;

INSERT INTO "ExamScheduleProctor" ("id", "examScheduleCourseId", "teacherId", "createdAt")
SELECT 'schedule-proctor-' || e."id", 'schedule-course-' || e."id", e."createdById", e."createdAt"
FROM "Exam" e;

-- Attempts are moved to their schedule while retaining the concrete enrolled class.
ALTER TABLE "ExamAttempt"
  ADD COLUMN "courseOfferingId" TEXT,
  ADD COLUMN "deadlineAt" TIMESTAMP(3),
  ADD COLUMN "examScheduleId" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "ExamAttempt" ea
SET
  "examScheduleId" = 'schedule-' || ea."examId",
  "courseOfferingId" = e."courseOfferingId",
  "deadlineAt" = ea."attemptEndAt"
FROM "Exam" e
WHERE e."id" = ea."examId";

ALTER TABLE "ExamAttempt"
  ALTER COLUMN "courseOfferingId" SET NOT NULL,
  ALTER COLUMN "deadlineAt" SET NOT NULL,
  ALTER COLUMN "examScheduleId" SET NOT NULL;

-- Map legacy lifecycle values before replacing enums.
ALTER TABLE "ExamAttempt" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "AttemptStatus_new" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED', 'INVALIDATED');
ALTER TABLE "ExamAttempt" ALTER COLUMN "status" TYPE "AttemptStatus_new" USING (
  CASE WHEN "status"::text = 'EXPIRED' THEN 'AUTO_SUBMITTED' ELSE "status"::text END
)::"AttemptStatus_new";
ALTER TYPE "AttemptStatus" RENAME TO "AttemptStatus_old";
ALTER TYPE "AttemptStatus_new" RENAME TO "AttemptStatus";
DROP TYPE "AttemptStatus_old";
ALTER TABLE "ExamAttempt" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

ALTER TABLE "Exam" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "ExamStatus_new" AS ENUM ('DRAFT', 'READY', 'LOCKED', 'ARCHIVED');
ALTER TABLE "Exam" ALTER COLUMN "status" TYPE "ExamStatus_new" USING (
  CASE
    WHEN "status"::text = 'PUBLISHED' THEN 'READY'
    WHEN "status"::text = 'CLOSED' THEN 'LOCKED'
    ELSE 'DRAFT'
  END
)::"ExamStatus_new";
ALTER TYPE "ExamStatus" RENAME TO "ExamStatus_old";
ALTER TYPE "ExamStatus_new" RENAME TO "ExamStatus";
DROP TYPE "ExamStatus_old";
ALTER TABLE "Exam" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Remove legacy relations and scheduling columns after all data is copied.
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_courseOfferingId_fkey";
ALTER TABLE "ExamAttempt" DROP CONSTRAINT "ExamAttempt_examId_fkey";
DROP INDEX "Exam_courseOfferingId_idx";
DROP INDEX "ExamAttempt_examId_idx";
DROP INDEX "ExamAttempt_examId_studentId_attemptNo_key";

ALTER TABLE "Exam"
  DROP COLUMN "allowReviewBeforeSubmit",
  DROP COLUMN "blockCopyPaste",
  DROP COLUMN "blockRightClick",
  DROP COLUMN "courseOfferingId",
  DROP COLUMN "durationMinutes",
  DROP COLUMN "enableWebcam",
  DROP COLUMN "endTime",
  DROP COLUMN "maxAttempts",
  DROP COLUMN "password",
  DROP COLUMN "publishedAt",
  DROP COLUMN "requireFullscreen",
  DROP COLUMN "resultPublished",
  DROP COLUMN "resultPublishedAt",
  DROP COLUMN "showResultImmediately",
  DROP COLUMN "shuffleOptions",
  DROP COLUMN "shuffleQuestions",
  DROP COLUMN "startTime";

ALTER TABLE "ExamAttempt"
  DROP COLUMN "attemptEndAt",
  DROP COLUMN "examId",
  DROP COLUMN "remainingSeconds";

-- Constraints and indexes for the final schema.
CREATE UNIQUE INDEX "Semester_code_key" ON "Semester"("code");
CREATE UNIQUE INDEX "Semester_academicYear_term_key" ON "Semester"("academicYear", "term");
CREATE INDEX "Exam_subjectId_idx" ON "Exam"("subjectId");
CREATE INDEX "ExamSchedule_examId_idx" ON "ExamSchedule"("examId");
CREATE INDEX "ExamSchedule_createdById_idx" ON "ExamSchedule"("createdById");
CREATE INDEX "ExamSchedule_startTime_endTime_idx" ON "ExamSchedule"("startTime", "endTime");
CREATE INDEX "ExamSchedule_status_idx" ON "ExamSchedule"("status");
CREATE INDEX "ExamScheduleCourse_courseOfferingId_idx" ON "ExamScheduleCourse"("courseOfferingId");
CREATE UNIQUE INDEX "ExamScheduleCourse_examScheduleId_courseOfferingId_key" ON "ExamScheduleCourse"("examScheduleId", "courseOfferingId");
CREATE INDEX "ExamScheduleProctor_teacherId_idx" ON "ExamScheduleProctor"("teacherId");
CREATE UNIQUE INDEX "ExamScheduleProctor_examScheduleCourseId_teacherId_key" ON "ExamScheduleProctor"("examScheduleCourseId", "teacherId");
CREATE INDEX "ExamAttempt_examScheduleId_idx" ON "ExamAttempt"("examScheduleId");
CREATE INDEX "ExamAttempt_courseOfferingId_idx" ON "ExamAttempt"("courseOfferingId");
CREATE UNIQUE INDEX "ExamAttempt_examScheduleId_studentId_attemptNo_key" ON "ExamAttempt"("examScheduleId", "studentId", "attemptNo");

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamScheduleCourse" ADD CONSTRAINT "ExamScheduleCourse_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamScheduleCourse" ADD CONSTRAINT "ExamScheduleCourse_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamScheduleProctor" ADD CONSTRAINT "ExamScheduleProctor_examScheduleCourseId_fkey" FOREIGN KEY ("examScheduleCourseId") REFERENCES "ExamScheduleCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamScheduleProctor" ADD CONSTRAINT "ExamScheduleProctor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
