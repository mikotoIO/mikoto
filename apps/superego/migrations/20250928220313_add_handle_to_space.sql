-- Add handle column to Space table
ALTER TABLE "Space" ADD COLUMN "handle" VARCHAR(64);

-- Create unique index on handle column
CREATE UNIQUE INDEX "Space_handle_key" ON "Space"("handle" ASC);
