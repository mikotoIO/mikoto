-- Add a mandatory handle column to User and Space tables.
-- The backfill_all() startup code ensures every entity has a Handle row;
-- this migration copies those values into the new column and sets NOT NULL.
--
-- We intentionally do NOT add a FK to Handle here because Handle + entity
-- creation happen in separate statements, and a FK would require deferrable
-- constraints or restructuring all creation flows.  The Handle table remains
-- the source of truth; the column on User/Space is kept in sync by
-- application code (claim_for_*, change_*_handle, auto_assign_for_*).

-- Step 1: Add nullable handle columns
ALTER TABLE "User"  ADD COLUMN handle VARCHAR(253);
ALTER TABLE "Space" ADD COLUMN handle VARCHAR(253);

-- Step 2: Populate from existing Handle rows
UPDATE "User"  u SET handle = h.handle FROM "Handle" h WHERE h."userId"  = u.id;
UPDATE "Space" s SET handle = h.handle FROM "Handle" h WHERE h."spaceId" = s.id;

-- Step 3: For any remaining rows without a handle (shouldn't exist after backfill,
-- but be defensive), set a placeholder so NOT NULL can be applied.
UPDATE "User"  SET handle = 'unset.' || id::text WHERE handle IS NULL;
UPDATE "Space" SET handle = 'unset.' || id::text WHERE handle IS NULL;

-- Step 4: Make NOT NULL
ALTER TABLE "User"  ALTER COLUMN handle SET NOT NULL;
ALTER TABLE "Space" ALTER COLUMN handle SET NOT NULL;

-- Step 5: Add unique constraints
ALTER TABLE "User"  ADD CONSTRAINT "User_handle_key"  UNIQUE (handle);
ALTER TABLE "Space" ADD CONSTRAINT "Space_handle_key" UNIQUE (handle);
