-- Add push token columns to MobileDevice table
ALTER TABLE "MobileDevice" ADD COLUMN "pushToken" TEXT;
ALTER TABLE "MobileDevice" ADD COLUMN "pushTokenUpdatedAt" TIMESTAMP(3);
