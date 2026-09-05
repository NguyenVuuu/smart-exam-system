-- CreateEnum
CREATE TYPE "ExamStudentVisibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- AlterTable
ALTER TABLE "Exam"
ADD COLUMN "studentVisibility" "ExamStudentVisibility" NOT NULL DEFAULT 'VISIBLE';
