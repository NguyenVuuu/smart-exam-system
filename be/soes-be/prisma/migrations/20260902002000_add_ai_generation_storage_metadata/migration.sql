CREATE TYPE "AIGenerationMode" AS ENUM ('GENERATE_FROM_MATERIAL', 'EXTRACT_EXISTING_EXAM');
CREATE TYPE "AIGenerationSourceType" AS ENUM ('COURSE_MATERIAL', 'UPLOAD_FILE');
CREATE TYPE "FileStorageProvider" AS ENUM ('LOCAL', 'SUPABASE');

ALTER TABLE "Material"
ADD COLUMN "title" TEXT,
ADD COLUMN "checksum" TEXT,
ADD COLUMN "storageProvider" "FileStorageProvider" NOT NULL DEFAULT 'LOCAL';

ALTER TABLE "AIGenerationHistory"
ADD COLUMN "subjectId" TEXT,
ADD COLUMN "examId" TEXT,
ADD COLUMN "mode" "AIGenerationMode" NOT NULL DEFAULT 'GENERATE_FROM_MATERIAL',
ADD COLUMN "sourceType" "AIGenerationSourceType" NOT NULL DEFAULT 'COURSE_MATERIAL',
ADD COLUMN "sourceFileName" TEXT,
ADD COLUMN "sourceFilePath" TEXT,
ADD COLUMN "sourceFileSize" INTEGER,
ADD COLUMN "sourceMimeType" TEXT,
ADD COLUMN "errorMessage" TEXT;

UPDATE "AIGenerationHistory" h
SET "subjectId" = co."subjectId"
FROM "CourseOffering" co
WHERE h."courseOfferingId" = co."id"
  AND h."subjectId" IS NULL;

ALTER TABLE "AIGenerationHistory"
ALTER COLUMN "subjectId" SET NOT NULL,
ALTER COLUMN "courseOfferingId" DROP NOT NULL,
ALTER COLUMN "mode" DROP DEFAULT,
ALTER COLUMN "sourceType" DROP DEFAULT;

ALTER TABLE "Question"
ADD COLUMN "aiDifficultyReason" TEXT;

ALTER TABLE "QuestionOption"
ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

WITH ordered_options AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "questionId" ORDER BY "id") - 1 AS "newOrderIndex"
  FROM "QuestionOption"
)
UPDATE "QuestionOption" qo
SET "orderIndex" = ordered_options."newOrderIndex"
FROM ordered_options
WHERE qo."id" = ordered_options."id";

CREATE INDEX "Material_checksum_idx" ON "Material"("checksum");
CREATE UNIQUE INDEX "QuestionOption_questionId_orderIndex_key" ON "QuestionOption"("questionId", "orderIndex");
CREATE INDEX "AIGenerationHistory_subjectId_idx" ON "AIGenerationHistory"("subjectId");
CREATE INDEX "AIGenerationHistory_examId_idx" ON "AIGenerationHistory"("examId");

ALTER TABLE "AIGenerationHistory"
ADD CONSTRAINT "AIGenerationHistory_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AIGenerationHistory"
ADD CONSTRAINT "AIGenerationHistory_examId_fkey"
FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIGenerationHistory"
DROP CONSTRAINT "AIGenerationHistory_courseOfferingId_fkey";

ALTER TABLE "AIGenerationHistory"
ADD CONSTRAINT "AIGenerationHistory_courseOfferingId_fkey"
FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subject"
DROP CONSTRAINT "Subject_departmentId_fkey";

ALTER TABLE "Subject"
ADD CONSTRAINT "Subject_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
