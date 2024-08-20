/*
  Warnings:

  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_userId_fkey";

-- DropTable
DROP TABLE "Verification";

-- CreateTable
CREATE TABLE "AccountVerification" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accountId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountVerification_token_key" ON "AccountVerification"("token");

-- AddForeignKey
ALTER TABLE "AccountVerification" ADD CONSTRAINT "AccountVerification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
