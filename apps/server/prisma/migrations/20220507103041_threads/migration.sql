-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TEXT', 'VOICE', 'THREAD', 'CATEGORY');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "parentId" UUID,
ADD COLUMN     "type" "ChannelType" NOT NULL DEFAULT E'TEXT';

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
