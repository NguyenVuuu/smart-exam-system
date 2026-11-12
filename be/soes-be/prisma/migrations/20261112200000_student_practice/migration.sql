CREATE TABLE "PracticeSet" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DECIMAL(6,2),
    CONSTRAINT "PracticeSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeItem" (
    "id" TEXT NOT NULL,
    "practiceSetId" TEXT NOT NULL,
    "sourceQuestionId" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "points" DECIMAL(6,2) NOT NULL,
    "snapshot" JSONB NOT NULL,
    CONSTRAINT "PracticeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeResponse" (
    "id" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "score" DECIMAL(6,2) NOT NULL,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PracticeSet_studentId_createdAt_idx" ON "PracticeSet"("studentId", "createdAt");
CREATE INDEX "PracticeSet_subjectId_idx" ON "PracticeSet"("subjectId");
CREATE INDEX "PracticeSet_topicId_idx" ON "PracticeSet"("topicId");
CREATE UNIQUE INDEX "PracticeItem_practiceSetId_orderIndex_key" ON "PracticeItem"("practiceSetId", "orderIndex");
CREATE UNIQUE INDEX "PracticeItem_practiceSetId_sourceQuestionId_key" ON "PracticeItem"("practiceSetId", "sourceQuestionId");
CREATE INDEX "PracticeItem_sourceQuestionId_idx" ON "PracticeItem"("sourceQuestionId");
CREATE UNIQUE INDEX "PracticeResponse_practiceItemId_key" ON "PracticeResponse"("practiceItemId");

ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LearningTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PracticeResponse" ADD CONSTRAINT "PracticeResponse_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
