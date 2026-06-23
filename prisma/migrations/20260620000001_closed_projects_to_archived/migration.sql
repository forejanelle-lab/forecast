-- Auto-closed projects use ARCHIVED so all Prisma clients can read them.
UPDATE "Project" SET status = 'ARCHIVED' WHERE status = 'CLOSED';
