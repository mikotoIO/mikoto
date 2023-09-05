-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "channelId" UUID NOT NULL,
    "content" STRING NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_channelId_key" ON "Document"("channelId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
