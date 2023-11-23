/*
  Warnings:

  - You are about to drop the `Relationship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_relationId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_userId_fkey";

-- DropTable
DROP TABLE "Relationship";
