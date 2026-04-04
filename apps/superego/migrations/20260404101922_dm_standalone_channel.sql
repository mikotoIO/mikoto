-- Make Channel.spaceId nullable (for standalone DM channels)
ALTER TABLE "Channel" ALTER COLUMN "spaceId" DROP NOT NULL;

-- Rename Relationship.spaceId to channelId
ALTER TABLE "Relationship" DROP CONSTRAINT IF EXISTS "Relationship_spaceId_fkey";
-- Clear old spaceId values (they pointed to Space, not Channel)
UPDATE "Relationship" SET "spaceId" = NULL WHERE "spaceId" IS NOT NULL;
ALTER TABLE "Relationship" RENAME COLUMN "spaceId" TO "channelId";
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_channelId_fkey"
  FOREIGN KEY ("channelId") REFERENCES "Channel"(id) ON DELETE SET NULL;
