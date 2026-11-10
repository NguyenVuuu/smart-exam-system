CREATE TYPE "FaceEnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE "FaceVerificationPurpose" AS ENUM ('ENROLLMENT', 'EXAM_ENTRY');
CREATE TYPE "FaceVerificationMethod" AS ENUM ('AWS_REKOGNITION', 'MANUAL_OVERRIDE');
CREATE TYPE "FaceVerificationStatus" AS ENUM ('CREATED', 'PROCESSING', 'PASSED', 'FAILED', 'EXPIRED', 'CONSUMED', 'MANUAL_APPROVED');

CREATE TABLE "StudentFaceProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "status" "FaceEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "failedAttemptsSinceSuccess" INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil" TIMESTAMP(3),
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFaceProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaceVerificationSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examScheduleId" TEXT,
    "attemptId" TEXT,
    "providerSessionId" TEXT,
    "purpose" "FaceVerificationPurpose" NOT NULL,
    "method" "FaceVerificationMethod" NOT NULL DEFAULT 'AWS_REKOGNITION',
    "status" "FaceVerificationStatus" NOT NULL DEFAULT 'CREATED',
    "livenessConfidence" DECIMAL(5,2),
    "similarity" DECIMAL(5,2),
    "failureCode" TEXT,
    "grantExpiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "manualReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceVerificationSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentFaceProfile_studentId_key" ON "StudentFaceProfile"("studentId");
CREATE UNIQUE INDEX "StudentFaceProfile_providerUserId_key" ON "StudentFaceProfile"("providerUserId");
CREATE INDEX "StudentFaceProfile_status_idx" ON "StudentFaceProfile"("status");
CREATE INDEX "StudentFaceProfile_cooldownUntil_idx" ON "StudentFaceProfile"("cooldownUntil");

CREATE UNIQUE INDEX "FaceVerificationSession_providerSessionId_key" ON "FaceVerificationSession"("providerSessionId");
CREATE INDEX "FaceVerificationSession_studentId_purpose_createdAt_idx" ON "FaceVerificationSession"("studentId", "purpose", "createdAt");
CREATE INDEX "FaceVerificationSession_examScheduleId_status_idx" ON "FaceVerificationSession"("examScheduleId", "status");
CREATE INDEX "FaceVerificationSession_attemptId_createdAt_idx" ON "FaceVerificationSession"("attemptId", "createdAt");
CREATE INDEX "FaceVerificationSession_status_expiresAt_idx" ON "FaceVerificationSession"("status", "expiresAt");
CREATE INDEX "FaceVerificationSession_approvedById_idx" ON "FaceVerificationSession"("approvedById");

ALTER TABLE "StudentFaceProfile"
ADD CONSTRAINT "StudentFaceProfile_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FaceVerificationSession"
ADD CONSTRAINT "FaceVerificationSession_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FaceVerificationSession"
ADD CONSTRAINT "FaceVerificationSession_examScheduleId_fkey"
FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FaceVerificationSession"
ADD CONSTRAINT "FaceVerificationSession_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FaceVerificationSession"
ADD CONSTRAINT "FaceVerificationSession_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

