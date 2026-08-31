UPDATE "Exam" AS exam
SET "status" = 'LOCKED'
WHERE exam."status" = 'READY'
  AND EXISTS (
    SELECT 1
    FROM "ExamSchedule" AS schedule
    WHERE schedule."examId" = exam."id"
  );
