CREATE TYPE "NotificationLevel" AS ENUM ('ALL', 'MENTIONS', 'NOTHING');

CREATE TABLE "NotificationPreference" (
    "userId" uuid NOT NULL,
    "spaceId" uuid NOT NULL,
    "level" "NotificationLevel" NOT NULL DEFAULT 'ALL',
    PRIMARY KEY ("userId", "spaceId"),
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("spaceId") REFERENCES "Space"(id) ON DELETE CASCADE
);
