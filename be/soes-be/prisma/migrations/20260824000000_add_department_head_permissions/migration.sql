-- CreateEnum
CREATE TYPE "TeacherPosition" AS ENUM ('LECTURER', 'DEPARTMENT_HEAD');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ExamApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Teacher"
ADD COLUMN "position" "TeacherPosition" NOT NULL DEFAULT 'LECTURER',
ADD COLUMN "departmentId" TEXT;

-- AlterTable
ALTER TABLE "Subject"
ADD COLUMN "departmentId" TEXT;

-- AlterTable
ALTER TABLE "QuestionBankItem"
ADD COLUMN "reviewedByTeacherId" TEXT;

-- AlterTable
ALTER TABLE "Exam"
ADD COLUMN "approvalStatus" "ExamApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Teacher_departmentId_idx" ON "Teacher"("departmentId");

-- CreateIndex
CREATE INDEX "Teacher_position_idx" ON "Teacher"("position");

-- CreateIndex
CREATE INDEX "Subject_departmentId_idx" ON "Subject"("departmentId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_reviewedByTeacherId_idx" ON "QuestionBankItem"("reviewedByTeacherId");

-- CreateIndex
CREATE INDEX "Exam_reviewedById_idx" ON "Exam"("reviewedById");

-- CreateIndex
CREATE INDEX "Exam_approvalStatus_idx" ON "Exam"("approvalStatus");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_reviewedByTeacherId_fkey" FOREIGN KEY ("reviewedByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
