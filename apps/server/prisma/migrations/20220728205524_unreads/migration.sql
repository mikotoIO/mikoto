-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "lastUpdated" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChannelUnread" (
    "channelId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelUnread_pkey" PRIMARY KEY ("channelId","userId")
);

-- AddForeignKey
ALTER TABLE "ChannelUnread" ADD CONSTRAINT "ChannelUnread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUnread" ADD CONSTRAINT "ChannelUnread_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
