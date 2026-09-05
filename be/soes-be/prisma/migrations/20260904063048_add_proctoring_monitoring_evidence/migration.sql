-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WebcamStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_PERMISSION', 'ACTIVE', 'DISCONNECTED', 'PERMISSION_DENIED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ScreenShareStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_PERMISSION', 'ACTIVE', 'STOPPED', 'PERMISSION_DENIED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ViolationSource" AS ENUM ('WEBCAM', 'SCREEN', 'BROWSER', 'PROCTOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ViolationDetectedBy" AS ENUM ('SYSTEM', 'PROCTOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ViolationReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ViolationEvidenceType" AS ENUM ('WEBCAM_IMAGE', 'SCREEN_IMAGE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
ALTER TYPE "AttemptEndedBy" ADD VALUE IF NOT EXISTS 'PROCTOR';

-- AlterEnum
ALTER TYPE "FileStorageProvider" ADD VALUE IF NOT EXISTS 'MINIO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'CAMERA_DISCONNECTED';
ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'CAMERA_PERMISSION_DENIED';
ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'SCREEN_SHARE_STOPPED';
ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'SCREEN_PERMISSION_DENIED';
ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'PROCTOR_WEBCAM_CAPTURE';
ALTER TYPE "ViolationType" ADD VALUE IF NOT EXISTS 'PROCTOR_SCREEN_CAPTURE';

-- AlterTable
ALTER TABLE "ExamAttempt" ADD COLUMN     "invalidatedAt" TIMESTAMP(3),
ADD COLUMN     "invalidatedById" TEXT,
ADD COLUMN     "invalidationReason" TEXT;

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "enableScreenMonitoring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proctoringStoragePath" TEXT;

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "lastScreenHeartbeatAt" TIMESTAMP(3),
ADD COLUMN     "lastWebcamHeartbeatAt" TIMESTAMP(3),
ADD COLUMN     "screenShareStatus" "ScreenShareStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "webcamStatus" "WebcamStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE "Violation" ADD COLUMN     "detectedBy" "ViolationDetectedBy" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "detectedById" TEXT,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" "ViolationReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "source" "ViolationSource" NOT NULL DEFAULT 'BROWSER',
ALTER COLUMN "evidenceUrls" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ViolationEvidence" (
    "id" TEXT NOT NULL,
    "evidenceType" "ViolationEvidenceType" NOT NULL,
    "storageProvider" "FileStorageProvider" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "violationId" TEXT NOT NULL,
    "capturedById" TEXT,

    CONSTRAINT "ViolationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViolationEvidence_violationId_idx" ON "ViolationEvidence"("violationId");

-- CreateIndex
CREATE INDEX "ViolationEvidence_evidenceType_idx" ON "ViolationEvidence"("evidenceType");

-- CreateIndex
CREATE INDEX "ViolationEvidence_capturedById_idx" ON "ViolationEvidence"("capturedById");

-- CreateIndex
CREATE INDEX "ViolationEvidence_storageProvider_idx" ON "ViolationEvidence"("storageProvider");

-- CreateIndex
CREATE INDEX "ExamAttempt_invalidatedById_idx" ON "ExamAttempt"("invalidatedById");

-- CreateIndex
CREATE INDEX "Violation_violationType_idx" ON "Violation"("violationType");

-- CreateIndex
CREATE INDEX "Violation_source_detectedAt_idx" ON "Violation"("source", "detectedAt");

-- CreateIndex
CREATE INDEX "Violation_reviewStatus_idx" ON "Violation"("reviewStatus");

-- CreateIndex
CREATE INDEX "Violation_detectedById_idx" ON "Violation"("detectedById");

-- CreateIndex
CREATE INDEX "Violation_reviewedById_idx" ON "Violation"("reviewedById");

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_invalidatedById_fkey" FOREIGN KEY ("invalidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_detectedById_fkey" FOREIGN KEY ("detectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationEvidence" ADD CONSTRAINT "ViolationEvidence_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "Violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationEvidence" ADD CONSTRAINT "ViolationEvidence_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
