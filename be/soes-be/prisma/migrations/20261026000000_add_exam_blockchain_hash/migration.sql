-- Add blockchain hash anchoring fields to Exam table
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "blockchainTxHash" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "blockchainAnchoredAt" TIMESTAMP(3);
