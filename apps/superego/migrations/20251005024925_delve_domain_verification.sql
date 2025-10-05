-- DelVe Domain Verification Tables

-- Table to store verified domains for users
CREATE TABLE "VerifiedDomain" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", domain)
);

CREATE INDEX "VerifiedDomain_userId_idx" ON "VerifiedDomain" USING btree ("userId");
CREATE INDEX "VerifiedDomain_domain_idx" ON "VerifiedDomain" USING btree (domain);

-- Table to store pending verification requests (for delegate mode)
CREATE TABLE "DomainVerificationRequest" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    challenge TEXT NOT NULL,
    "requestId" TEXT,
    "expiresAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' -- pending, completed, failed, expired
);

CREATE INDEX "DomainVerificationRequest_userId_idx" ON "DomainVerificationRequest" USING btree ("userId");
CREATE INDEX "DomainVerificationRequest_status_idx" ON "DomainVerificationRequest" USING btree (status);
CREATE INDEX "DomainVerificationRequest_expiresAt_idx" ON "DomainVerificationRequest" USING btree ("expiresAt");
