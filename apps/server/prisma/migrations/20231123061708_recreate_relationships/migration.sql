-- CreateTable
CREATE TABLE "Relationship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "state" "RelationState" NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relationship_relationId_idx" ON "Relationship"("relationId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_userId_relationId_key" ON "Relationship"("userId", "relationId");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
