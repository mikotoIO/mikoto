-- Add migration script here
-- Add migration script here
-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TEXT', 'VOICE', 'DOCUMENT', 'APPLICATION', 'THREAD', 'CATEGORY');

-- CreateEnum
CREATE TYPE "RelationState" AS ENUM ('NONE', 'FRIEND', 'BLOCKED', 'INCOMING_REQUEST', 'OUTGOING_REQUEST');

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('NONE', 'DM', 'GROUP');

-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('BOT', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passhash" VARCHAR(256) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountVerification" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accountId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ban" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "reason" TEXT,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "ownerId" UUID NOT NULL,
    "secret" TEXT NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" UUID NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'TEXT',
    "parentId" UUID,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(64) NOT NULL,
    "spaceId" UUID NOT NULL,
    "lastUpdated" TIMESTAMP(3),

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelUnread" (
    "channelId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelUnread_pkey" PRIMARY KEY ("channelId","userId")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "channelId" UUID NOT NULL,
    "content" VARCHAR(262144) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "spaceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" UUID,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "content" VARCHAR(4096) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "editedTimestamp" TIMESTAMP(3),
    "authorId" UUID,
    "channelId" UUID NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accountId" UUID NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "state" "RelationState" NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color" TEXT,
    "permissions" VARCHAR(128) NOT NULL,
    "position" INTEGER NOT NULL,
    "spaceId" UUID NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "data" VARCHAR(262144) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "icon" VARCHAR(256),
    "ownerId" UUID,
    "type" "SpaceType" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceUser" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64),
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "SpaceUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "avatar" VARCHAR(256),
    "description" VARCHAR(2048),
    "category" "UserCategory",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatus" (
    "id" UUID NOT NULL,
    "presence" TEXT,
    "content" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToSpaceUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AccountVerification_token_key" ON "AccountVerification"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Ban_spaceId_userId_key" ON "Ban"("spaceId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "Channel_spaceId_idx" ON "Channel"("spaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Document_channelId_key" ON "Document"("channelId" ASC);

-- CreateIndex
CREATE INDEX "Message_channelId_timestamp_idx" ON "Message"("channelId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "RefreshToken_accountId_idx" ON "RefreshToken"("accountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token" ASC);

-- CreateIndex
CREATE INDEX "Relationship_relationId_idx" ON "Relationship"("relationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_userId_relationId_key" ON "Relationship"("userId" ASC, "relationId" ASC);

-- CreateIndex
CREATE INDEX "Role_spaceId_idx" ON "Role"("spaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId" ASC);

-- CreateIndex
CREATE INDEX "SpaceUser_spaceId_idx" ON "SpaceUser"("spaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceUser_userId_spaceId_key" ON "SpaceUser"("userId" ASC, "spaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToSpaceUser_AB_unique" ON "_RoleToSpaceUser"("A" ASC, "B" ASC);

-- CreateIndex
CREATE INDEX "_RoleToSpaceUser_B_index" ON "_RoleToSpaceUser"("B" ASC);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountVerification" ADD CONSTRAINT "AccountVerification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUnread" ADD CONSTRAINT "ChannelUnread_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUnread" ADD CONSTRAINT "ChannelUnread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStatus" ADD CONSTRAINT "UserStatus_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSpaceUser" ADD CONSTRAINT "_RoleToSpaceUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSpaceUser" ADD CONSTRAINT "_RoleToSpaceUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SpaceUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;