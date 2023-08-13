/*
  Warnings:

  - You are about to alter the column `id` on the `Invite` table. The data in that column will be cast from `Uuid` to `String`. This cast may fail. Please make sure the data in the column can be cast.

*/
-- RedefineTables
CREATE TABLE "_prisma_new_Invite" (
    "id" STRING NOT NULL,
    "spaceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorID" UUID,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);
INSERT INTO "_prisma_new_Invite" ("id","spaceId") SELECT "id","spaceId" FROM "Invite";
DROP TABLE "Invite" CASCADE;
ALTER TABLE "_prisma_new_Invite" RENAME TO "Invite";
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
