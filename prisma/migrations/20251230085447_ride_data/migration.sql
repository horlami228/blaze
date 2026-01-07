/*
  Warnings:

  - You are about to alter the column `latitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,8)`.
  - You are about to alter the column `longitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(11,8)`.
  - You are about to alter the column `distance` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `dropoffLatitude` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,8)`.
  - You are about to alter the column `dropoffLongitude` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(11,8)`.
  - You are about to alter the column `pickupLatitude` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,8)`.
  - You are about to alter the column `pickupLongitude` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(11,8)`.

*/
-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "latitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "longitude" SET DATA TYPE DECIMAL(11,8);

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "path_json" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "distance" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "dropoffLatitude" DROP NOT NULL,
ALTER COLUMN "dropoffLatitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "dropoffLongitude" DROP NOT NULL,
ALTER COLUMN "dropoffLongitude" SET DATA TYPE DECIMAL(11,8),
ALTER COLUMN "pickupLatitude" DROP NOT NULL,
ALTER COLUMN "pickupLatitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "pickupLongitude" DROP NOT NULL,
ALTER COLUMN "pickupLongitude" SET DATA TYPE DECIMAL(11,8);
