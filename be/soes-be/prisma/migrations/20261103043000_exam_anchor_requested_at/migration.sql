ALTER TABLE "Exam" ADD COLUMN "anchorRequestedAt" TIMESTAMP(3);

CREATE INDEX "Exam_anchorRequestedAt_blockchainAnchoredAt_idx"
ON "Exam"("anchorRequestedAt", "blockchainAnchoredAt");
