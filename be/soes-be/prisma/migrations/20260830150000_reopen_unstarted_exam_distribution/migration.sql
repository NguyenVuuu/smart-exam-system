UPDATE "Exam" AS exam
SET "status" = 'READY'
WHERE exam."status" = 'LOCKED'
  AND NOT EXISTS (
    SELECT 1
    FROM "ExamSchedule" AS schedule
    WHERE schedule."examId" = exam."id"
      AND (
        EXISTS (
          SELECT 1
          FROM "ExamAttempt" AS attempt
          WHERE attempt."examScheduleId" = schedule."id"
        )
        OR (
          schedule."status" NOT IN ('DRAFT', 'CANCELLED')
          AND schedule."startTime" <= CURRENT_TIMESTAMP
        )
      )
  );
