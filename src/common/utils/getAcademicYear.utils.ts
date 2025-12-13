import { PrismaClient } from '@prisma/client';
export async function getAcademicYear() {
  const prisma = new PrismaClient();
  const currentAcademicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });

  if (!currentAcademicYear) {
    throw new Error('No active academic year found');
  }

  return currentAcademicYear;
}
