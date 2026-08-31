ALTER TABLE "Question" ADD COLUMN "title" TEXT;

UPDATE "Question"
SET "title" = LEFT(
  COALESCE(NULLIF(BTRIM(SPLIT_PART("content", E'\n', 1)), ''), 'Câu hỏi'),
  200
);

ALTER TABLE "Question" ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "ExamQuestion" ADD COLUMN "title" TEXT;

UPDATE "ExamQuestion"
SET "title" = LEFT(
  COALESCE(NULLIF(BTRIM(SPLIT_PART("content", E'\n', 1)), ''), 'Câu hỏi'),
  200
);

ALTER TABLE "ExamQuestion" ALTER COLUMN "title" SET NOT NULL;
