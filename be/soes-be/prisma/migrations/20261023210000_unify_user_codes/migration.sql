-- Every account receives one code. The same User.username is exposed for
-- student, teacher, department-head, and backoffice views.
UPDATE "User"
SET "username" = '__user_code_migration__' || "id";

WITH numbered_users AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "id") AS sequence_number
  FROM "User"
)
UPDATE "User" AS u
SET "username" = 'US' || LPAD(numbered_users.sequence_number::text, 6, '0')
FROM numbered_users
WHERE u."id" = numbered_users."id";

UPDATE "Student" AS s
SET "studentCode" = u."username"
FROM "User" AS u
WHERE s."userId" = u."id";

UPDATE "Teacher" AS t
SET "teacherCode" = u."username"
FROM "User" AS u
WHERE t."userId" = u."id";

UPDATE "Admin" AS a
SET "adminCode" = u."username"
FROM "User" AS u
WHERE a."userId" = u."id";
