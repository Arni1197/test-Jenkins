/*
  Warnings:

  - You are about to drop the column `isEmailConfirmed` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isEmailConfirmed",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");
