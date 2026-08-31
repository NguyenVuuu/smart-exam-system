CREATE TABLE "QuestionProgrammingConfig" (
  "id" TEXT NOT NULL,
  "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
  "memoryLimitKb" INTEGER NOT NULL DEFAULT 262144,
  "maxCodeSizeKb" INTEGER NOT NULL DEFAULT 256,
  "questionId" TEXT NOT NULL,
  CONSTRAINT "QuestionProgrammingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionProgrammingTestCase" (
  "id" TEXT NOT NULL,
  "input" TEXT NOT NULL,
  "expectedOutput" TEXT NOT NULL,
  "weight" DECIMAL(5,2) NOT NULL,
  "isSample" BOOLEAN NOT NULL DEFAULT false,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "orderIndex" INTEGER NOT NULL,
  "questionId" TEXT NOT NULL,
  CONSTRAINT "QuestionProgrammingTestCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionProgrammingConfig_questionId_key" ON "QuestionProgrammingConfig"("questionId");
CREATE UNIQUE INDEX "QuestionProgrammingTestCase_questionId_orderIndex_key" ON "QuestionProgrammingTestCase"("questionId", "orderIndex");
CREATE INDEX "QuestionProgrammingTestCase_questionId_idx" ON "QuestionProgrammingTestCase"("questionId");
ALTER TABLE "QuestionProgrammingConfig" ADD CONSTRAINT "QuestionProgrammingConfig_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionProgrammingTestCase" ADD CONSTRAINT "QuestionProgrammingTestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
