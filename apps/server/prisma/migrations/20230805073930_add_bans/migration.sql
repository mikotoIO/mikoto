/*
  Warnings:

  - You are about to drop the column `bTOA` on the `Relationship` table. All the data in the column will be lost.
  - Added the required column `bToA` to the `Relationship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Relationship" DROP COLUMN "bTOA";
ALTER TABLE "Relationship" ADD COLUMN     "bToA" "RelationState" NOT NULL;

-- CreateTable
CREATE TABLE "Ban" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "reason" STRING,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ban_spaceId_userId_key" ON "Ban"("spaceId", "userId");

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
