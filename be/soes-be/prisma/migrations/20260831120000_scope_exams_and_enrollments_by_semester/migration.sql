-- Scope enrollments to one subject per semester.
ALTER TABLE "Enrollment"
ADD COLUMN "semesterId" TEXT,
ADD COLUMN "subjectId" TEXT;

UPDATE "Enrollment" AS enrollment
SET
  "semesterId" = offering."semesterId",
  "subjectId" = offering."subjectId"
FROM "CourseOffering" AS offering
WHERE offering."id" = enrollment."courseOfferingId";

-- Preserve the oldest enrollment when legacy data contains duplicate subject registrations.
DELETE FROM "Enrollment"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "subjectId", "semesterId"
        ORDER BY "enrolledAt", "id"
      ) AS duplicate_order
    FROM "Enrollment"
  ) AS ranked
  WHERE ranked.duplicate_order > 1
);

ALTER TABLE "Enrollment"
ALTER COLUMN "semesterId" SET NOT NULL,
ALTER COLUMN "subjectId" SET NOT NULL;

CREATE UNIQUE INDEX "Enrollment_studentId_subjectId_semesterId_key"
ON "Enrollment"("studentId", "subjectId", "semesterId");
CREATE INDEX "Enrollment_semesterId_idx" ON "Enrollment"("semesterId");
CREATE INDEX "Enrollment_subjectId_idx" ON "Enrollment"("subjectId");

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_semesterId_fkey"
FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Attach every operational exam to a semester.
ALTER TABLE "Exam" ADD COLUMN "semesterId" TEXT;

UPDATE "Exam" AS exam
SET "semesterId" = scheduled."semesterId"
FROM (
  SELECT DISTINCT ON (schedule."examId")
    schedule."examId",
    offering."semesterId"
  FROM "ExamSchedule" AS schedule
  JOIN "ExamScheduleCourse" AS schedule_course
    ON schedule_course."examScheduleId" = schedule."id"
  JOIN "CourseOffering" AS offering
    ON offering."id" = schedule_course."courseOfferingId"
  ORDER BY schedule."examId", schedule."startTime", schedule_course."createdAt"
) AS scheduled
WHERE scheduled."examId" = exam."id";

UPDATE "Exam"
SET "semesterId" = (
  SELECT "id" FROM "Semester"
  WHERE "status" = 'ACTIVE'
  ORDER BY "startDate" DESC
  LIMIT 1
)
WHERE "semesterId" IS NULL;

UPDATE "Exam"
SET "semesterId" = (
  SELECT "id" FROM "Semester"
  ORDER BY "startDate" DESC
  LIMIT 1
)
WHERE "semesterId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Exam" WHERE "semesterId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot assign existing exams to a semester because no semester exists';
  END IF;
END $$;

ALTER TABLE "Exam" ALTER COLUMN "semesterId" SET NOT NULL;
CREATE INDEX "Exam_semesterId_idx" ON "Exam"("semesterId");
ALTER TABLE "Exam"
ADD CONSTRAINT "Exam_semesterId_fkey"
FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
