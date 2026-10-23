CREATE TYPE "BackofficeRole" AS ENUM ('ADMIN', 'EDUCATION_OFFICER');

ALTER TABLE "Admin"
ADD COLUMN "role" "BackofficeRole" NOT NULL DEFAULT 'ADMIN';

CREATE TABLE "AdminPermissionOverride" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermissionOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPermissionOverride_adminId_permission_key"
ON "AdminPermissionOverride"("adminId", "permission");

ALTER TABLE "AdminPermissionOverride"
ADD CONSTRAINT "AdminPermissionOverride_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
