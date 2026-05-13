-- Custom emojis and message reactions

CREATE TABLE "Emoji" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "url" TEXT NOT NULL,
    "uploaderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Emoji_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Emoji_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Emoji_spaceId_name_key" ON "Emoji"("spaceId", "name");
CREATE INDEX "Emoji_spaceId_idx" ON "Emoji"("spaceId");

-- Reactions on messages. The `emoji` column holds either a raw unicode emoji
-- (e.g. "👍") or a custom emoji reference of the form "custom:<uuid>".
CREATE TABLE "MessageReaction" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId", "userId", "emoji"),
    CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");
