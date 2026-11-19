UPDATE "ExamAttempt" AS attempt
SET "forceSubmitReason" = audit.metadata->>'reason'
FROM (
  SELECT DISTINCT ON ("entityId") "entityId", metadata
  FROM "AuditLog"
  WHERE action = 'FORCE_SUBMIT_EXAM_ATTEMPT_BY_PROCTOR'
    AND "entityType" = 'ExamAttempt'
    AND metadata->>'reason' IS NOT NULL
  ORDER BY "entityId", "createdAt" DESC
) AS audit
WHERE attempt.id = audit."entityId"
  AND attempt."endedBy" = 'PROCTOR'
  AND attempt."forceSubmitReason" IS NULL;
