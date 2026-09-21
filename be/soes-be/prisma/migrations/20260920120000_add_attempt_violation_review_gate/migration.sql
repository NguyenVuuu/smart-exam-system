ALTER TABLE "ExamAttempt"
ADD COLUMN "violationsViewedAt" TIMESTAMP(3),
ADD COLUMN "violationsViewedById" TEXT;

CREATE INDEX "ExamAttempt_violationsViewedById_idx" ON "ExamAttempt"("violationsViewedById");

ALTER TABLE "ExamAttempt"
ADD CONSTRAINT "ExamAttempt_violationsViewedById_fkey"
FOREIGN KEY ("violationsViewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
