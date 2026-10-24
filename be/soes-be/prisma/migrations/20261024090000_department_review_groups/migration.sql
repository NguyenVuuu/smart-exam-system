CREATE TYPE "ReviewGroupStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ReviewGroupMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ExamReviewRoundStatus" AS ENUM ('WAITING_FOR_REVIEWERS', 'PENDING', 'APPROVED', 'REVISION_REQUESTED');
CREATE TYPE "ExamReviewDecisionType" AS ENUM ('APPROVE', 'REQUEST_REVISION');

CREATE TABLE "DepartmentReviewGroup" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ReviewGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepartmentReviewGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepartmentReviewMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "ReviewGroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    CONSTRAINT "DepartmentReviewMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamReviewRound" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ExamReviewRoundStatus" NOT NULL DEFAULT 'WAITING_FOR_REVIEWERS',
    "snapshot" JSONB NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamReviewRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamReviewDecision" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "type" "ExamReviewDecisionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamReviewDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentReviewGroup_departmentId_key" ON "DepartmentReviewGroup"("departmentId");
CREATE UNIQUE INDEX "DepartmentReviewMember_groupId_teacherId_key" ON "DepartmentReviewMember"("groupId", "teacherId");
CREATE INDEX "DepartmentReviewMember_teacherId_status_idx" ON "DepartmentReviewMember"("teacherId", "status");
CREATE UNIQUE INDEX "ExamReviewRound_examId_version_key" ON "ExamReviewRound"("examId", "version");
CREATE INDEX "ExamReviewRound_groupId_status_submittedAt_idx" ON "ExamReviewRound"("groupId", "status", "submittedAt");
CREATE UNIQUE INDEX "ExamReviewDecision_roundId_key" ON "ExamReviewDecision"("roundId");
CREATE INDEX "ExamReviewDecision_reviewerId_idx" ON "ExamReviewDecision"("reviewerId");

ALTER TABLE "DepartmentReviewGroup" ADD CONSTRAINT "DepartmentReviewGroup_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepartmentReviewGroup" ADD CONSTRAINT "DepartmentReviewGroup_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepartmentReviewMember" ADD CONSTRAINT "DepartmentReviewMember_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "DepartmentReviewGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepartmentReviewMember" ADD CONSTRAINT "DepartmentReviewMember_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamReviewRound" ADD CONSTRAINT "ExamReviewRound_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamReviewRound" ADD CONSTRAINT "ExamReviewRound_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "DepartmentReviewGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamReviewRound" ADD CONSTRAINT "ExamReviewRound_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamReviewDecision" ADD CONSTRAINT "ExamReviewDecision_roundId_fkey"
    FOREIGN KEY ("roundId") REFERENCES "ExamReviewRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamReviewDecision" ADD CONSTRAINT "ExamReviewDecision_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
