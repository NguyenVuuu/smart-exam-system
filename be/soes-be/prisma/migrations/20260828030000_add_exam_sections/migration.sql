CREATE TYPE "ExamSectionType" AS ENUM ('OBJECTIVE', 'PROGRAMMING');

CREATE TABLE "ExamSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "ExamSectionType" NOT NULL,
  "targetPoints" DECIMAL(5,2) NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "examId" TEXT NOT NULL,
  CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExamQuestion" ADD COLUMN "sectionId" TEXT;
CREATE UNIQUE INDEX "ExamSection_examId_orderIndex_key" ON "ExamSection"("examId", "orderIndex");
CREATE INDEX "ExamSection_examId_idx" ON "ExamSection"("examId");
CREATE INDEX "ExamQuestion_sectionId_idx" ON "ExamQuestion"("sectionId");
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
