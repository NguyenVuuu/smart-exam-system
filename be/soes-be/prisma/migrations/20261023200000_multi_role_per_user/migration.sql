-- Migration: multi_role_per_user
-- Remove @unique constraints on userId in Student, Teacher, Admin tables
-- to allow one User to have multiple role profiles.

-- These account fields are part of the current User model but were missing
-- from the original migration chain. Add them before later migrations and
-- seed data start using them.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'DEPARTMENT_HEAD', 'STUDENT');
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['STUDENT']::"UserRole"[];
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Drop unique constraints
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_userId_key";
ALTER TABLE "Teacher" DROP CONSTRAINT IF EXISTS "Teacher_userId_key";
ALTER TABLE "Admin" DROP CONSTRAINT IF EXISTS "Admin_userId_key";

-- Add indexes for userId lookups (performance)
CREATE INDEX IF NOT EXISTS "Student_userId_idx" ON "Student"("userId");
CREATE INDEX IF NOT EXISTS "Teacher_userId_idx" ON "Teacher"("userId");
CREATE INDEX IF NOT EXISTS "Admin_userId_idx" ON "Admin"("userId");
