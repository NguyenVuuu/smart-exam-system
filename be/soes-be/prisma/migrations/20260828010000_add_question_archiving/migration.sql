ALTER TABLE "Question" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "QuestionBankItem" ADD COLUMN "removedByTeacherId" TEXT;
ALTER TABLE "QuestionBankItem" ADD COLUMN "removalReason" TEXT;
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_removedByTeacherId_fkey" FOREIGN KEY ("removedByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Question_archivedAt_idx" ON "Question"("archivedAt");
CREATE INDEX "QuestionBankItem_removedByTeacherId_idx" ON "QuestionBankItem"("removedByTeacherId");
