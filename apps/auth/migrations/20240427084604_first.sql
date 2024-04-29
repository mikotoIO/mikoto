-- Add migration script here
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL
);

CREATE TABLE "EmailAuth" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passhash" VARCHAR(255),

    FOREIGN KEY (id) REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RefreshToken" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "expires_at" TIMESTAMP NOT NULL,

    FOREIGN KEY ("user_id") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SocialAuth" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    "provider" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,

    "provider_id" VARCHAR(255) UNIQUE NOT NULL,

    FOREIGN KEY ("user_id") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SocialAuth_provider_user_id"
    ON "SocialAuth"("provider", "user_id");