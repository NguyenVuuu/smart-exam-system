-- CreateEnum
CREATE TYPE "GradeAppealStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ViolationReviewStatus" ADD VALUE IF NOT EXISTS 'REVIEWED';
ALTER TYPE "ViolationReviewStatus" ADD VALUE IF NOT EXISTS 'WARNED';
ALTER TYPE "ViolationReviewStatus" ADD VALUE IF NOT EXISTS 'FORCE_SUBMITTED';
ALTER TYPE "ViolationReviewStatus" ADD VALUE IF NOT EXISTS 'INVALIDATED';

-- CreateTable
CREATE TABLE "GradeAppeal" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "GradeAppealStatus" NOT NULL DEFAULT 'PENDING',
    "teacherReply" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "handledById" TEXT,

    CONSTRAINT "GradeAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeAppeal_attemptId_idx" ON "GradeAppeal"("attemptId");
CREATE INDEX "GradeAppeal_studentId_createdAt_idx" ON "GradeAppeal"("studentId", "createdAt");
CREATE INDEX "GradeAppeal_handledById_idx" ON "GradeAppeal"("handledById");
CREATE INDEX "GradeAppeal_status_idx" ON "GradeAppeal"("status");

-- AddForeignKey
ALTER TABLE "GradeAppeal" ADD CONSTRAINT "GradeAppeal_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeAppeal" ADD CONSTRAINT "GradeAppeal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GradeAppeal" ADD CONSTRAINT "GradeAppeal_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
