-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('NONE', 'DM', 'GROUP');

-- CreateEnum
CREATE TYPE "RelationState" AS ENUM ('NONE', 'FRIEND', 'BLOCKED');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "type" "SpaceType" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Relationship" (
    "id" UUID NOT NULL,
    "alphaId" UUID NOT NULL,
    "betaId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "aToB" "RelationState" NOT NULL,
    "bTOA" "RelationState" NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_spaceId_key" ON "Relationship"("spaceId");

-- CreateIndex
CREATE INDEX "Relationship_betaId_idx" ON "Relationship"("betaId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_alphaId_betaId_key" ON "Relationship"("alphaId", "betaId");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_alphaId_fkey" FOREIGN KEY ("alphaId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_betaId_fkey" FOREIGN KEY ("betaId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
