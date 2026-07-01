/*
  Warnings:

  - You are about to alter the column `totalScore` on the `ExamAttempt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `autoScore` on the `ExamAttempt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `manualScore` on the `ExamAttempt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `points` on the `ExamQuestion` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `weight` on the `ProgrammingTestCase` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `score` on the `StudentAnswer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ProgrammingSubmission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `CourseOffering` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attemptId]` on the table `ExamSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teacherCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProgrammingSubmission" DROP CONSTRAINT "ProgrammingSubmission_studentAnswerId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "ExamAttempt" ALTER COLUMN "totalScore" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "autoScore" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "manualScore" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "ExamQuestion" ALTER COLUMN "points" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "ExamSession" ALTER COLUMN "socketId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProgrammingTestCase" ALTER COLUMN "weight" DROP DEFAULT,
ALTER COLUMN "weight" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "StudentAnswer" ADD COLUMN     "essayAnswer" TEXT,
ADD COLUMN     "sourceCode" TEXT,
ALTER COLUMN "score" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneNumber" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "ProgrammingSubmission";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "CodeGenerationSetting" (
    "id" TEXT NOT NULL DEFAULT 'SYSTEM',
    "studentPrefix" TEXT NOT NULL DEFAULT 'SV',
    "studentDigits" INTEGER NOT NULL DEFAULT 6,
    "teacherPrefix" TEXT NOT NULL DEFAULT 'GV',
    "teacherDigits" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeGenerationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_code_key" ON "CourseOffering"("code");

-- CreateIndex
CREATE INDEX "CourseOffering_teacherId_idx" ON "CourseOffering"("teacherId");

-- CreateIndex
CREATE INDEX "CourseOffering_semesterId_idx" ON "CourseOffering"("semesterId");

-- CreateIndex
CREATE INDEX "CourseOffering_subjectId_idx" ON "CourseOffering"("subjectId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Exam_courseOfferingId_idx" ON "Exam"("courseOfferingId");

-- CreateIndex
CREATE INDEX "Exam_createdById_idx" ON "Exam"("createdById");

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "Exam"("status");

-- CreateIndex
CREATE INDEX "ExamAttemptQuestion_attemptId_idx" ON "ExamAttemptQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "ExamAttemptQuestion_questionId_idx" ON "ExamAttemptQuestion"("questionId");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- CreateIndex
CREATE INDEX "ExamQuestion_questionId_idx" ON "ExamQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_attemptId_key" ON "ExamSession"("attemptId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "ProgrammingTestCase_questionId_idx" ON "ProgrammingTestCase"("questionId");

-- CreateIndex
CREATE INDEX "Question_ownerId_idx" ON "Question"("ownerId");

-- CreateIndex
CREATE INDEX "Question_subjectId_idx" ON "Question"("subjectId");

-- CreateIndex
CREATE INDEX "Question_type_idx" ON "Question"("type");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "StudentAnswer_questionId_idx" ON "StudentAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentCode_key" ON "User"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_teacherCode_key" ON "User"("teacherCode");
