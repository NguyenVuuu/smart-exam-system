INSERT INTO "ExamSection" ("id", "title", "description", "type", "targetPoints", "orderIndex", "examId")
SELECT
  'section-objective-' || e."id",
  'Phần 1: Trắc nghiệm',
  'Câu hỏi trắc nghiệm chấm tự động.',
  'OBJECTIVE'::"ExamSectionType",
  COALESCE(NULLIF(SUM(eq."points") FILTER (WHERE eq."type" <> 'PROGRAMMING'), 0),
    CASE WHEN e."format" = 'MIXED' THEN e."totalPoints" / 2 ELSE e."totalPoints" END),
  1,
  e."id"
FROM "Exam" e
LEFT JOIN "ExamQuestion" eq ON eq."examId" = e."id"
WHERE e."format" IN ('OBJECTIVE', 'MIXED')
  AND NOT EXISTS (SELECT 1 FROM "ExamSection" s WHERE s."examId" = e."id" AND s."type" = 'OBJECTIVE')
GROUP BY e."id";

INSERT INTO "ExamSection" ("id", "title", "description", "type", "targetPoints", "orderIndex", "examId")
SELECT
  'section-programming-' || e."id",
  CASE WHEN e."format" = 'MIXED' THEN 'Phần 2: Lập trình' ELSE 'Phần 1: Lập trình' END,
  'Câu hỏi lập trình chấm bằng test case.',
  'PROGRAMMING'::"ExamSectionType",
  COALESCE(NULLIF(SUM(eq."points") FILTER (WHERE eq."type" = 'PROGRAMMING'), 0),
    CASE WHEN e."format" = 'MIXED' THEN e."totalPoints" / 2 ELSE e."totalPoints" END),
  CASE WHEN e."format" = 'MIXED' THEN 2 ELSE 1 END,
  e."id"
FROM "Exam" e
LEFT JOIN "ExamQuestion" eq ON eq."examId" = e."id"
WHERE e."format" IN ('PROGRAMMING', 'MIXED')
  AND NOT EXISTS (SELECT 1 FROM "ExamSection" s WHERE s."examId" = e."id" AND s."type" = 'PROGRAMMING')
GROUP BY e."id";

UPDATE "ExamQuestion" eq
SET "sectionId" = CASE
  WHEN eq."type" = 'PROGRAMMING' THEN 'section-programming-' || eq."examId"
  ELSE 'section-objective-' || eq."examId"
END
WHERE eq."sectionId" IS NULL;
