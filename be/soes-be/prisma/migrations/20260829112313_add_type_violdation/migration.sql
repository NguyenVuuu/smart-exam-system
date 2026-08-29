-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ViolationType" ADD VALUE 'LOOKING_AWAY';
ALTER TYPE "ViolationType" ADD VALUE 'COPY_PASTE';
ALTER TYPE "ViolationType" ADD VALUE 'CAMERA_BLOCKED';
