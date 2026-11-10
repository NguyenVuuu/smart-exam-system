ALTER TABLE "StudentFaceProfile"
  ADD COLUMN "referenceImageCiphertext" BYTEA,
  ADD COLUMN "referenceImageMimeType" TEXT,
  ADD COLUMN "referenceImageCapturedAt" TIMESTAMP(3),
  ADD COLUMN "imageConsentAt" TIMESTAMP(3);

ALTER TABLE "FaceVerificationSession"
  ADD COLUMN "imageConsentAt" TIMESTAMP(3);

CREATE TABLE "FaceReviewCapture" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "examScheduleId" TEXT NOT NULL,
  "sourceSessionId" TEXT NOT NULL,
  "imageCiphertext" BYTEA NOT NULL,
  "imageMimeType" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaceReviewCapture_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FaceReviewCapture_studentId_examScheduleId_key"
  ON "FaceReviewCapture"("studentId", "examScheduleId");
CREATE INDEX "FaceReviewCapture_expiresAt_idx" ON "FaceReviewCapture"("expiresAt");

ALTER TABLE "FaceReviewCapture" ADD CONSTRAINT "FaceReviewCapture_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FaceReviewCapture" ADD CONSTRAINT "FaceReviewCapture_examScheduleId_fkey"
  FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
