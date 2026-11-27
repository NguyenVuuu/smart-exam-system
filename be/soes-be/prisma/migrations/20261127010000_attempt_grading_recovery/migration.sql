ALTER TABLE "ExamAttempt"
  ADD COLUMN "gradingPending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gradingClaimToken" TEXT,
  ADD COLUMN "gradingLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "gradingRetryAt" TIMESTAMP(3),
  ADD COLUMN "gradingFailures" INTEGER NOT NULL DEFAULT 0;

UPDATE "ExamAttempt" SET "gradingPending" = true
WHERE "status" IN ('SUBMITTED', 'AUTO_SUBMITTED', 'GRADING')
  AND "autoScore" IS NULL AND "totalScore" IS NULL AND "manualScore" IS NULL
  AND "submittedAt" IS NOT NULL;

CREATE INDEX "ExamAttempt_gradingPending_submittedAt_id_idx"
  ON "ExamAttempt" ("gradingPending", "submittedAt", "id");
