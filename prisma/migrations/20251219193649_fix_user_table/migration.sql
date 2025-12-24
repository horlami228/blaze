-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "driverLicenseNumber" TEXT,
ADD COLUMN     "driverLicensePhoto" TEXT,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gender" "Gender" DEFAULT 'MALE',
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
