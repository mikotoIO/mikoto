/*
  Warnings:

  - You are about to drop the column `aToB` on the `Relationship` table. All the data in the column will be lost.
  - You are about to drop the column `alphaId` on the `Relationship` table. All the data in the column will be lost.
  - You are about to drop the column `bToA` on the `Relationship` table. All the data in the column will be lost.
  - You are about to drop the column `betaId` on the `Relationship` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,relationId]` on the table `Relationship` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `relationId` to the `Relationship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Relationship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Relationship` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_alphaId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_betaId_fkey";

-- DropIndex
DROP INDEX "Relationship_alphaId_betaId_key";

-- DropIndex
DROP INDEX "Relationship_betaId_idx";

-- AlterTable
ALTER TABLE "Relationship" DROP COLUMN "aToB";
ALTER TABLE "Relationship" DROP COLUMN "alphaId";
ALTER TABLE "Relationship" DROP COLUMN "bToA";
ALTER TABLE "Relationship" DROP COLUMN "betaId";
ALTER TABLE "Relationship" ADD COLUMN     "relationId" UUID NOT NULL;
ALTER TABLE "Relationship" ADD COLUMN     "state" "RelationState" NOT NULL;
ALTER TABLE "Relationship" ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Relationship_relationId_idx" ON "Relationship"("relationId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_userId_relationId_key" ON "Relationship"("userId", "relationId");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
