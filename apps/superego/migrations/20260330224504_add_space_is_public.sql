CREATE TYPE "SpaceVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

ALTER TABLE "Space" ADD COLUMN visibility "SpaceVisibility";
