/*
  Warnings:

  - The primary key for the `UserProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `UserProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authUserId]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authUserId` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users"."UserProfile_userId_idx";

-- DropIndex
DROP INDEX "users"."UserProfile_userId_key";

-- AlterTable
ALTER TABLE "users"."UserProfile" DROP CONSTRAINT "UserProfile_pkey",
DROP COLUMN "userId",
ADD COLUMN     "authUserId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserProfile_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_authUserId_key" ON "users"."UserProfile"("authUserId");

-- CreateIndex
CREATE INDEX "UserProfile_authUserId_idx" ON "users"."UserProfile"("authUserId");
