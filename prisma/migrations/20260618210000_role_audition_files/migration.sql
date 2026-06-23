-- Persist role audition material metadata (and optional file data URLs) in the database.
ALTER TABLE "Role" ADD COLUMN "auditionFiles" JSONB;
