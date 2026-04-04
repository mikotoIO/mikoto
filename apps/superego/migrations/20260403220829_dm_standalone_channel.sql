-- DM standalone channels: make Channel.spaceId nullable, and refactor
-- Relationship to point directly to a Channel instead of a Space.

-- Make Channel.spaceId nullable (for standalone DM channels)
ALTER TABLE "Channel" ALTER COLUMN "spaceId" DROP NOT NULL;

-- Rename Relationship.spaceId -> channelId (nullable)
ALTER TABLE "Relationship" DROP CONSTRAINT IF EXISTS "Relationship_spaceId_fkey";
ALTER TABLE "Relationship" ALTER COLUMN "spaceId" DROP NOT NULL;
ALTER TABLE "Relationship" ALTER COLUMN "spaceId" SET DEFAULT NULL;
UPDATE "Relationship" SET "spaceId" = NULL WHERE "spaceId" IS NOT NULL;
ALTER TABLE "Relationship" RENAME COLUMN "spaceId" TO "channelId";
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_channelId_fkey"
  FOREIGN KEY ("channelId") REFERENCES "Channel"(id) ON DELETE SET NULL;
