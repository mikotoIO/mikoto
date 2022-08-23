-- DropIndex
DROP INDEX "Message_channelId_idx";

-- DropIndex
DROP INDEX "Message_timestamp_idx";

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "icon" STRING;

-- CreateIndex
CREATE INDEX "Message_channelId_timestamp_idx" ON "Message"("channelId", "timestamp");
