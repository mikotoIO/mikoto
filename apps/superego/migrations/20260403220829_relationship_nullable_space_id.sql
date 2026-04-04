-- Make spaceId nullable on Relationship table.
-- Relationships start without a DM space; the space is created lazily on first open_dm call.
ALTER TABLE "Relationship" ALTER COLUMN "spaceId" DROP NOT NULL;
ALTER TABLE "Relationship" ALTER COLUMN "spaceId" SET DEFAULT NULL;
