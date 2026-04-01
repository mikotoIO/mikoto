-- E2EE DM support: KeyPackages, MLS groups, MLS handshake messages

-- Fix Relationship.spaceId to be nullable (Rust entity already declares Option<Uuid>)
ALTER TABLE "Relationship" ALTER COLUMN "spaceId" DROP NOT NULL;

-- Add ciphertext column for encrypted messages
ALTER TABLE "Message" ADD COLUMN ciphertext BYTEA;

-- MLS KeyPackages: one per device, consumed when used to initiate a group
CREATE TABLE "KeyPackage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "deviceId" UUID NOT NULL,
    data BYTEA NOT NULL,
    ciphersuite TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX "KeyPackage_userId_unconsumed_idx" ON "KeyPackage" ("userId") WHERE consumed = FALSE;

-- MLS group state: links an MLS group to a Space
CREATE TABLE "MlsGroup" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "spaceId" UUID NOT NULL UNIQUE REFERENCES "Space"(id) ON DELETE CASCADE,
    "groupId" BYTEA NOT NULL UNIQUE,
    epoch BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MLS handshake message mailbox (Welcome, Commit, Proposal)
CREATE TABLE "MlsMessage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "recipientUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "mlsGroupId" UUID NOT NULL REFERENCES "MlsGroup"(id) ON DELETE CASCADE,
    "messageType" TEXT NOT NULL,
    data BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX "MlsMessage_recipient_idx" ON "MlsMessage" ("recipientUserId", delivered);
