/*
  Warnings:

  - You are about to drop the column `driverLicenseNumber` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `driverLicensePhoto` on the `Driver` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "driverLicenseNumber",
DROP COLUMN "driverLicensePhoto",
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "licensePhoto" TEXT;
