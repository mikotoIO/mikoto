-- CreateTable
CREATE TABLE "UserStatus" (
    "id" UUID NOT NULL,
    "presence" STRING NOT NULL,
    "content" STRING NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserStatus" ADD CONSTRAINT "UserStatus_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
