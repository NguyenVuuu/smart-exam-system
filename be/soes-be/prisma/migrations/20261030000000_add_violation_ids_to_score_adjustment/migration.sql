-- Add violationIds to ScoreAdjustment for referencing violation evidence images
ALTER TABLE "ScoreAdjustment" ADD COLUMN IF NOT EXISTS "violationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
