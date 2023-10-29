/*
  Warnings:

  - You are about to drop the column `creatorID` on the `Invite` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_creatorID_fkey";

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "creatorID";
ALTER TABLE "Invite" ADD COLUMN     "creatorId" UUID;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
