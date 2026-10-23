-- The current database is missing the password column required by User.
-- Preserve existing accounts and give legacy rows the seed default password.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;

UPDATE "User"
SET "password" = '$2b$10$3lXSSX4PT/KFLIQr1e6Wt.7RtaoWG0AmQ/Shklne/m/be4kv.zPPy'
WHERE "password" IS NULL;

ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- Passwords are stored only on User in the current schema.
ALTER TABLE "Student" DROP COLUMN IF EXISTS "password";
ALTER TABLE "Teacher" DROP COLUMN IF EXISTS "password";
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "password";
