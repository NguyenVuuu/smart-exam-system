UPDATE "Violation"
SET "endedAt" = "detectedAt", "durationSeconds" = 0
WHERE "violationType" IN ('PROCTOR_WEBCAM_CAPTURE', 'PROCTOR_SCREEN_CAPTURE')
  AND ("endedAt" IS DISTINCT FROM "detectedAt" OR "durationSeconds" IS DISTINCT FROM 0);
