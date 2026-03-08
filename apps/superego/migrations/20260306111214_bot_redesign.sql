-- Bot redesign: add visibility, permissions, and token tracking

CREATE TYPE "BotVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "Bot"
    ADD COLUMN "visibility" "BotVisibility" NOT NULL DEFAULT 'PRIVATE',
    ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "lastTokenRegeneratedAt" TIMESTAMPTZ;
