/*
  Warnings:

  - Added the required column `position` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "order" INT4 NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "position" INT4 NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "color" DROP NOT NULL;
