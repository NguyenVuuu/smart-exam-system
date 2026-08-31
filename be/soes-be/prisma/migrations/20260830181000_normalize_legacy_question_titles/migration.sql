UPDATE "Question"
SET "title" = REGEXP_REPLACE("title", '\s*[-–]\s*Thời gian\s*:.*$', '', 'i')
WHERE "title" ~* '\s*[-–]\s*Thời gian\s*:';

UPDATE "ExamQuestion"
SET "title" = REGEXP_REPLACE("title", '\s*[-–]\s*Thời gian\s*:.*$', '', 'i')
WHERE "title" ~* '\s*[-–]\s*Thời gian\s*:';
