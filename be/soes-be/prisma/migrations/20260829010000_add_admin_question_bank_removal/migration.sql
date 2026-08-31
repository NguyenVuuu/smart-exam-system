ALTER TABLE "QuestionBankItem" ADD COLUMN "removedByAdminId" TEXT;

CREATE INDEX "QuestionBankItem_removedByAdminId_idx" ON "QuestionBankItem"("removedByAdminId");

ALTER TABLE "QuestionBankItem"
ADD CONSTRAINT "QuestionBankItem_removedByAdminId_fkey"
FOREIGN KEY ("removedByAdminId") REFERENCES "Admin"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
