-- Create unified Handle table for both users and spaces
-- Handles are domain-based identifiers (e.g., "hayley.mikoto.io" or "hayley.moe")
CREATE TABLE "Handle" (
    handle VARCHAR(253) PRIMARY KEY,  -- Max domain name length
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "spaceId" UUID REFERENCES "Space"(id) ON DELETE CASCADE,
    "verifiedAt" TIMESTAMP(3),  -- null for default handles, set when custom domain is verified
    attestation JSONB,  -- signed proof for federation trust
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Exactly one of userId or spaceId must be set
    CONSTRAINT handle_single_owner
        CHECK (("userId" IS NULL) != ("spaceId" IS NULL))
);

CREATE INDEX "Handle_userId_idx" ON "Handle" ("userId");
CREATE INDEX "Handle_spaceId_idx" ON "Handle" ("spaceId");

-- Remove handle column from Space table (now using Handle table)
ALTER TABLE "Space" DROP COLUMN IF EXISTS handle;
