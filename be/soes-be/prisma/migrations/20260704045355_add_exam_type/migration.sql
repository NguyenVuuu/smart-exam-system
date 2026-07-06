/*
  Warnings:

  - Added the required column `type` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('QUIZ', 'MIDTERM', 'FINAL');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "type" "ExamType" NOT NULL;
