ALTER TABLE "StudentFaceProfile" ADD COLUMN "providerFaceId" TEXT;
CREATE UNIQUE INDEX "StudentFaceProfile_providerFaceId_key" ON "StudentFaceProfile"("providerFaceId");
