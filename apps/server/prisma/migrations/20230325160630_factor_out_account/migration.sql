/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passhash` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "email" STRING NOT NULL,
    "passhash" STRING NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- copy over data from User to Account
INSERT INTO "Account" ("id", "email", "passhash", "userId") SELECT "id", "email", "passhash", "id" FROM "User";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email";
ALTER TABLE "User" DROP COLUMN "passhash";
