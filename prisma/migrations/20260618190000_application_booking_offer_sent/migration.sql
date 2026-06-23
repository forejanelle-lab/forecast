ALTER TABLE "Application" ADD COLUMN "bookingOfferSentAt" TIMESTAMP(3);

UPDATE "Application"
SET "bookingOfferSentAt" = "updatedAt"
WHERE status = 'ACCEPTED';
