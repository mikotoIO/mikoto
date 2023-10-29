-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('BOT', 'UNVERIFIED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "category" "UserCategory";

-- CreateTable
CREATE TABLE "Bot" (
    "id" UUID NOT NULL,
    "name" STRING NOT NULL,
    "ownerId" UUID NOT NULL,
    "secret" STRING NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
