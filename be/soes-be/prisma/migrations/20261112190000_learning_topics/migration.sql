CREATE TABLE "LearningTopic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionTopic" (
    "questionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "QuestionTopic_pkey" PRIMARY KEY ("questionId", "topicId")
);

CREATE TABLE "ExamQuestionTopic" (
    "examQuestionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ExamQuestionTopic_pkey" PRIMARY KEY ("examQuestionId", "topicId")
);

CREATE UNIQUE INDEX "LearningTopic_subjectId_code_key" ON "LearningTopic"("subjectId", "code");
CREATE INDEX "LearningTopic_subjectId_idx" ON "LearningTopic"("subjectId");
CREATE INDEX "QuestionTopic_topicId_idx" ON "QuestionTopic"("topicId");
CREATE INDEX "ExamQuestionTopic_topicId_idx" ON "ExamQuestionTopic"("topicId");

ALTER TABLE "LearningTopic" ADD CONSTRAINT "LearningTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LearningTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamQuestionTopic" ADD CONSTRAINT "ExamQuestionTopic_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestionTopic" ADD CONSTRAINT "ExamQuestionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LearningTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
