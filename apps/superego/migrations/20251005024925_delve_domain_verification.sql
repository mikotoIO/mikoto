-- DelVe Domain Verification Tables

-- Table to store verified handles (domains) for users
CREATE TABLE "VerifiedHandle" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", domain)
);

CREATE INDEX "VerifiedHandle_userId_idx" ON "VerifiedHandle" USING btree ("userId");
CREATE INDEX "VerifiedHandle_domain_idx" ON "VerifiedHandle" USING btree (domain);

-- Table to store pending verification requests (for delegate mode)
CREATE TABLE "HandleVerificationRequest" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    challenge TEXT NOT NULL,
    "requestId" TEXT,
    "expiresAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' -- pending, completed, failed, expired
);

CREATE INDEX "HandleVerificationRequest_userId_idx" ON "HandleVerificationRequest" USING btree ("userId");
CREATE INDEX "HandleVerificationRequest_status_idx" ON "HandleVerificationRequest" USING btree (status);
CREATE INDEX "HandleVerificationRequest_expiresAt_idx" ON "HandleVerificationRequest" USING btree ("expiresAt");
