-- Keep only the most recently started active semester if legacy data contains more than one.
WITH ranked_active_semesters AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "startDate" DESC, "id") AS active_order
  FROM "Semester"
  WHERE "status" = 'ACTIVE'
)
UPDATE "Semester"
SET "status" = 'CLOSED'
WHERE "id" IN (
  SELECT "id"
  FROM ranked_active_semesters
  WHERE active_order > 1
);

-- A course can remain open only while its semester is the current semester.
UPDATE "CourseOffering" AS offering
SET "status" = 'CLOSED'
FROM "Semester" AS semester
WHERE semester."id" = offering."semesterId"
  AND semester."status" <> 'ACTIVE'
  AND offering."status" = 'ACTIVE';

CREATE UNIQUE INDEX "Semester_single_active_idx"
ON "Semester" ("status")
WHERE "status" = 'ACTIVE';
