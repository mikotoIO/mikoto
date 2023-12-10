/*
  Warnings:

  - The `icon` column on the `Space` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `SpaceUser` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `avatar` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `id` on the `Invite` table. The data in that column will be cast from `String` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - Changed the type of `email` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `passhash` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Bot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Channel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `content` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `content` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `permissions` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Space` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
SET SESSION enable_experimental_alter_column_type_general = true;

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "passhash" TYPE STRING(256);

-- AlterTable
ALTER TABLE "Bot" ALTER COLUMN "name" TYPE STRING(64);

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "name" TYPE STRING(64);

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "content" TYPE STRING(262144);

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "content" TYPE STRING(4096);

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "name" TYPE STRING(64);
ALTER TABLE "Role" ALTER COLUMN "permissions" TYPE STRING(128);

-- AlterTable
ALTER TABLE "Space" ALTER COLUMN "name" TYPE STRING(64);
ALTER TABLE "Space" ALTER COLUMN "icon" TYPE STRING(256);

-- AlterTable
ALTER TABLE "SpaceUser" ALTER COLUMN "name" TYPE STRING(64);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" TYPE STRING(64);
ALTER TABLE "User" ALTER COLUMN "avatar" TYPE STRING(256);
