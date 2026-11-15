-- Custom emoji, uploaded per space and usable as `:name:` in that space.
CREATE TABLE "Emoji" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "creatorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Emoji" ADD CONSTRAINT "Emoji_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Emoji" ADD CONSTRAINT "Emoji_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Names are unique within a space, ignoring case.
CREATE UNIQUE INDEX "Emoji_spaceId_name_key" ON "Emoji"("spaceId", lower("name"));

-- One row per (message, user, emoji). `emoji` is a standard emoji shortcode
-- (e.g. `+1`) or, for a custom emoji, its id as text; `emojiId` is set for
-- custom emoji so deleting the emoji removes its reactions.
CREATE TABLE "MessageReaction" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "emojiId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId", "userId", "emoji")
);

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_emojiId_fkey" FOREIGN KEY ("emojiId") REFERENCES "Emoji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "MessageReaction_emojiId_idx" ON "MessageReaction"("emojiId");
