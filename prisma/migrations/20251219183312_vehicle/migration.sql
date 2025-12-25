/*
  Warnings:

  - You are about to drop the column `endLocation` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `startLocation` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `dropoffAddress` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffLatitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffLongitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLatitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLongitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VehicleColor" AS ENUM ('BLACK', 'WHITE', 'SILVER', 'GRAY', 'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'BROWN', 'GOLD', 'BEIGE', 'PURPLE', 'OTHER');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_ratedDriverId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_ratedRiderId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_rideId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_driverId_fkey";

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "endLocation",
DROP COLUMN "startLocation",
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "dropoffAddress" TEXT NOT NULL,
ADD COLUMN     "dropoffLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "dropoffLongitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fare" DOUBLE PRECISION,
ADD COLUMN     "pickupAddress" TEXT NOT NULL,
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "endDateTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "type",
ADD COLUMN     "color" "VehicleColor" NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "exteriorPhoto" TEXT,
ADD COLUMN     "interiorPhoto" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "modelId" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "VehicleManufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleManufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleManufacturer_name_key" ON "VehicleManufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_manufacturerId_name_key" ON "VehicleModel"("manufacturerId", "name");

-- CreateIndex
CREATE INDEX "Driver_deletedAt_idx" ON "Driver"("deletedAt");

-- CreateIndex
CREATE INDEX "Rating_ratedRiderId_deletedAt_idx" ON "Rating"("ratedRiderId", "deletedAt");

-- CreateIndex
CREATE INDEX "Rating_ratedDriverId_deletedAt_idx" ON "Rating"("ratedDriverId", "deletedAt");

-- CreateIndex
CREATE INDEX "Ride_driverId_status_startDateTime_idx" ON "Ride"("driverId", "status", "startDateTime");

-- CreateIndex
CREATE INDEX "Ride_riderId_status_startDateTime_idx" ON "Ride"("riderId", "status", "startDateTime");

-- CreateIndex
CREATE INDEX "Rider_deletedAt_idx" ON "Rider"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "Vehicle"("isActive");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedDriverId_fkey" FOREIGN KEY ("ratedDriverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedRiderId_fkey" FOREIGN KEY ("ratedRiderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "VehicleManufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
