-- CreateTable
CREATE TABLE "Verification" (
    "id" UUID NOT NULL,
    "category" STRING NOT NULL,
    "token" STRING NOT NULL,
    "userId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_token_key" ON "Verification"("token");

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
