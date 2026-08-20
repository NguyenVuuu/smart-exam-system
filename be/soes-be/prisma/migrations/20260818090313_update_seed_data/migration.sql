/*
  Warnings:

  - The values [ARCHIVED] on the enum `PostStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isPublished` on the `ExamAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `orderIndex` on the `ExamAttemptQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `ExamAttemptQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `ProgrammingTestCase` table. All the data in the column will be lost.
  - You are about to drop the column `essayAnswer` on the `StudentAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `StudentAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `sourceCode` on the `StudentAnswer` table. All the data in the column will be lost.
  - The `selectedOptionIds` column on the `StudentAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[attemptId,examQuestionId]` on the table `ExamAttemptQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attemptId,displayOrder]` on the table `ExamAttemptQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examId,orderIndex]` on the table `ExamQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attemptId,examQuestionId]` on the table `StudentAnswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attemptEndAt` to the `ExamAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayOrder` to the `ExamAttemptQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examQuestionId` to the `ExamAttemptQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `ExamQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `ExamQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderIndex` to the `ExamQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ExamQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examQuestionId` to the `ProgrammingTestCase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examQuestionId` to the `StudentAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamCreationMethod" AS ENUM ('MANUAL', 'QUESTION_BANK', 'AI_GENERATED', 'MIXED');

-- CreateEnum
CREATE TYPE "QuestionBankItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProgrammingSubmissionStatus" AS ENUM ('PENDING', 'COMPILING', 'COMPILE_ERROR', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "ProgrammingTestResultStatus" AS ENUM ('PASSED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'SYSTEM_ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "PostStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
ALTER TABLE "Post" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Post" ALTER COLUMN "status" TYPE "PostStatus_new" USING ("status"::text::"PostStatus_new");
ALTER TYPE "PostStatus" RENAME TO "PostStatus_old";
ALTER TYPE "PostStatus_new" RENAME TO "PostStatus";
DROP TYPE "PostStatus_old";
ALTER TABLE "Post" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "ExamAttemptQuestion" DROP CONSTRAINT "ExamAttemptQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "ProgrammingTestCase" DROP CONSTRAINT "ProgrammingTestCase_questionId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAnswer" DROP CONSTRAINT "StudentAnswer_questionId_fkey";

-- DropIndex
DROP INDEX "ExamAttemptQuestion_attemptId_orderIndex_key";

-- DropIndex
DROP INDEX "ExamAttemptQuestion_attemptId_questionId_key";

-- DropIndex
DROP INDEX "ExamAttemptQuestion_questionId_idx";

-- DropIndex
DROP INDEX "ExamQuestion_examId_questionId_key";

-- DropIndex
DROP INDEX "ExamQuestion_questionId_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- DropIndex
DROP INDEX "Post_courseOfferingId_idx";

-- DropIndex
DROP INDEX "ProgrammingTestCase_questionId_idx";

-- DropIndex
DROP INDEX "StudentAnswer_attemptId_questionId_key";

-- DropIndex
DROP INDEX "StudentAnswer_questionId_idx";

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "blockCopyPaste" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "blockRightClick" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "creationMethod" "ExamCreationMethod" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "enableWebcam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireFullscreen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resultPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resultPublishedAt" TIMESTAMP(3),
ALTER COLUMN "type" SET DEFAULT 'QUIZ';

-- AlterTable
ALTER TABLE "ExamAttempt" DROP COLUMN "isPublished",
ADD COLUMN     "attemptEndAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ExamAttemptQuestion" DROP COLUMN "orderIndex",
DROP COLUMN "questionId",
ADD COLUMN     "displayOrder" INTEGER NOT NULL,
ADD COLUMN     "examQuestionId" TEXT NOT NULL,
ADD COLUMN     "shuffledOptionIds" TEXT[];

-- AlterTable
ALTER TABLE "ExamQuestion" DROP COLUMN "questionId",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "difficulty" "QuestionDifficulty" NOT NULL,
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "language" "ProgrammingLanguage",
ADD COLUMN     "orderIndex" INTEGER NOT NULL,
ADD COLUMN     "sourceQuestionId" TEXT,
ADD COLUMN     "type" "QuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "ProgrammingTestCase" DROP COLUMN "questionId",
ADD COLUMN     "examQuestionId" TEXT NOT NULL,
ADD COLUMN     "isSample" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "aiGenerationId" TEXT,
ADD COLUMN     "aiReviewStatus" "AIReviewStatus";

-- AlterTable
ALTER TABLE "StudentAnswer" DROP COLUMN "essayAnswer",
DROP COLUMN "questionId",
DROP COLUMN "sourceCode",
ADD COLUMN     "draftSourceCode" TEXT,
ADD COLUMN     "examQuestionId" TEXT NOT NULL,
DROP COLUMN "selectedOptionIds",
ADD COLUMN     "selectedOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankItem" (
    "id" TEXT NOT NULL,
    "questionBankId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "QuestionBankItemStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGenerationHistory" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "status" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIGenerationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGenerationMaterial" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "AIGenerationMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestionOption" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "examQuestionId" TEXT NOT NULL,

    CONSTRAINT "ExamQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingSubmission" (
    "id" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "submissionNo" INTEGER NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "language" "ProgrammingLanguage" NOT NULL,
    "status" "ProgrammingSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" DECIMAL(5,2),
    "passedTestCases" INTEGER NOT NULL DEFAULT 0,
    "totalTestCases" INTEGER NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER,
    "memoryUsedKb" INTEGER,
    "compilerOutput" TEXT,
    "runtimeError" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attemptId" TEXT NOT NULL,
    "examQuestionId" TEXT NOT NULL,

    CONSTRAINT "ProgrammingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingSubmissionTestResult" (
    "id" TEXT NOT NULL,
    "status" "ProgrammingTestResultStatus" NOT NULL,
    "actualOutput" TEXT,
    "executionTimeMs" INTEGER,
    "memoryUsedKb" INTEGER,
    "errorMessage" TEXT,
    "judge0Token" TEXT,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,

    CONSTRAINT "ProgrammingSubmissionTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingQuestionConfig" (
    "id" TEXT NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 262144,
    "maxCodeSizeKb" INTEGER NOT NULL DEFAULT 256,
    "examQuestionId" TEXT NOT NULL,

    CONSTRAINT "ProgrammingQuestionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_subjectId_key" ON "QuestionBank"("subjectId");

-- CreateIndex
CREATE INDEX "QuestionBank_subjectId_idx" ON "QuestionBank"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBankItem_questionId_key" ON "QuestionBankItem"("questionId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_questionBankId_status_removedAt_idx" ON "QuestionBankItem"("questionBankId", "status", "removedAt");

-- CreateIndex
CREATE INDEX "AIGenerationHistory_teacherId_idx" ON "AIGenerationHistory"("teacherId");

-- CreateIndex
CREATE INDEX "AIGenerationHistory_courseOfferingId_idx" ON "AIGenerationHistory"("courseOfferingId");

-- CreateIndex
CREATE INDEX "AIGenerationMaterial_historyId_idx" ON "AIGenerationMaterial"("historyId");

-- CreateIndex
CREATE INDEX "AIGenerationMaterial_materialId_idx" ON "AIGenerationMaterial"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "AIGenerationMaterial_historyId_materialId_key" ON "AIGenerationMaterial"("historyId", "materialId");

-- CreateIndex
CREATE INDEX "ExamQuestionOption_examQuestionId_idx" ON "ExamQuestionOption"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestionOption_examQuestionId_orderIndex_key" ON "ExamQuestionOption"("examQuestionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingSubmission_clientRequestId_key" ON "ProgrammingSubmission"("clientRequestId");

-- CreateIndex
CREATE INDEX "ProgrammingSubmission_attemptId_examQuestionId_submittedAt_idx" ON "ProgrammingSubmission"("attemptId", "examQuestionId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingSubmission_attemptId_examQuestionId_submissionNo_key" ON "ProgrammingSubmission"("attemptId", "examQuestionId", "submissionNo");

-- CreateIndex
CREATE INDEX "ProgrammingSubmissionTestResult_submissionId_idx" ON "ProgrammingSubmissionTestResult"("submissionId");

-- CreateIndex
CREATE INDEX "ProgrammingSubmissionTestResult_testCaseId_idx" ON "ProgrammingSubmissionTestResult"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingSubmissionTestResult_submissionId_testCaseId_key" ON "ProgrammingSubmissionTestResult"("submissionId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingQuestionConfig_examQuestionId_key" ON "ProgrammingQuestionConfig"("examQuestionId");

-- CreateIndex
CREATE INDEX "ExamAttemptQuestion_examQuestionId_idx" ON "ExamAttemptQuestion"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttemptQuestion_attemptId_examQuestionId_key" ON "ExamAttemptQuestion"("attemptId", "examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttemptQuestion_attemptId_displayOrder_key" ON "ExamAttemptQuestion"("attemptId", "displayOrder");

-- CreateIndex
CREATE INDEX "ExamQuestion_sourceQuestionId_idx" ON "ExamQuestion"("sourceQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_orderIndex_key" ON "ExamQuestion"("examId", "orderIndex");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "ProgrammingTestCase_examQuestionId_idx" ON "ProgrammingTestCase"("examQuestionId");

-- CreateIndex
CREATE INDEX "Question_aiGenerationId_idx" ON "Question"("aiGenerationId");

-- CreateIndex
CREATE INDEX "StudentAnswer_examQuestionId_idx" ON "StudentAnswer"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnswer_attemptId_examQuestionId_key" ON "StudentAnswer"("attemptId", "examQuestionId");

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_aiGenerationId_fkey" FOREIGN KEY ("aiGenerationId") REFERENCES "AIGenerationHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationHistory" ADD CONSTRAINT "AIGenerationHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationHistory" ADD CONSTRAINT "AIGenerationHistory_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationMaterial" ADD CONSTRAINT "AIGenerationMaterial_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "AIGenerationHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationMaterial" ADD CONSTRAINT "AIGenerationMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestionOption" ADD CONSTRAINT "ExamQuestionOption_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttemptQuestion" ADD CONSTRAINT "ExamAttemptQuestion_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingSubmission" ADD CONSTRAINT "ProgrammingSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingSubmission" ADD CONSTRAINT "ProgrammingSubmission_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingSubmissionTestResult" ADD CONSTRAINT "ProgrammingSubmissionTestResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProgrammingSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingSubmissionTestResult" ADD CONSTRAINT "ProgrammingSubmissionTestResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "ProgrammingTestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingTestCase" ADD CONSTRAINT "ProgrammingTestCase_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingQuestionConfig" ADD CONSTRAINT "ProgrammingQuestionConfig_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
