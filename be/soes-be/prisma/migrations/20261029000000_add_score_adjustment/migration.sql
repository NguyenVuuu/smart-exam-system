-- CreateEnum
CREATE TYPE "ScoreAdjustmentType" AS ENUM ('SYSTEM_ERROR', 'VIOLATION', 'MANUAL_REVIEW', 'GRADE_APPEAL', 'OTHER');

-- CreateTable
CREATE TABLE "ScoreAdjustment" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "adjustedById" TEXT NOT NULL,
    "adjustmentType" "ScoreAdjustmentType" NOT NULL,
    "previousScore" DECIMAL(5,2) NOT NULL,
    "newScore" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoreAdjustment_attemptId_idx" ON "ScoreAdjustment"("attemptId");

-- CreateIndex
CREATE INDEX "ScoreAdjustment_adjustedById_idx" ON "ScoreAdjustment"("adjustedById");

-- AddForeignKey
ALTER TABLE "ScoreAdjustment" ADD CONSTRAINT "ScoreAdjustment_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreAdjustment" ADD CONSTRAINT "ScoreAdjustment_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "Teacher"("id") ON UPDATE CASCADE;
