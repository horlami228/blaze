-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "lastHeading" DECIMAL(5,2),
ADD COLUMN     "lastKnownLatitude" DECIMAL(10,8),
ADD COLUMN     "lastKnownLongitude" DECIMAL(11,8),
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "lastSpeed" DECIMAL(5,2);
