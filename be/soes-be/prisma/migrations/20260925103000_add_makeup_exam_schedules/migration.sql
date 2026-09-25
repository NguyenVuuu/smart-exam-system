ALTER TABLE "ExamSchedule"
ADD COLUMN "makeupOfScheduleId" TEXT;

CREATE TABLE "ExamScheduleStudent" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamScheduleStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamScheduleStudent_examScheduleId_studentId_key"
ON "ExamScheduleStudent"("examScheduleId", "studentId");

CREATE INDEX "ExamScheduleStudent_studentId_idx"
ON "ExamScheduleStudent"("studentId");

CREATE INDEX "ExamSchedule_makeupOfScheduleId_idx"
ON "ExamSchedule"("makeupOfScheduleId");

ALTER TABLE "ExamSchedule"
ADD CONSTRAINT "ExamSchedule_makeupOfScheduleId_fkey"
FOREIGN KEY ("makeupOfScheduleId") REFERENCES "ExamSchedule"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExamScheduleStudent"
ADD CONSTRAINT "ExamScheduleStudent_examScheduleId_fkey"
FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamScheduleStudent"
ADD CONSTRAINT "ExamScheduleStudent_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
