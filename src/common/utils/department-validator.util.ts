import { Department, StudentLevel } from '@prisma/client';

export class DepartmentValidator {
  // Senior Secondary levels that require department
  private static readonly SENIOR_LEVELS: StudentLevel[] = [
    'SS_1',
    'SS_2',
    'SS_3',
  ];

  /**
   * Validate and return department based on student level
   * @throws Error if SS student has no department
   */
  static validateDepartment(
    department: string | undefined,
    studentLevel: StudentLevel,
  ): Department {
    const isSeniorStudent = this.SENIOR_LEVELS.includes(studentLevel);

    // If no department provided
    if (!department || department.trim() === '') {
      if (isSeniorStudent) {
        throw new Error(
          `Department is required for ${studentLevel} students. Must be SCIENCE, ARTS, or COMMERCIAL.`,
        );
      }
      // Junior students default to NONE
      return Department.NONE;
    }

    // Normalize department
    const normalizedDept = department.trim().toUpperCase();

    // Validate it's a valid department
    if (!Object.values(Department).includes(normalizedDept as Department)) {
      throw new Error(
        `Invalid department: ${department}. Must be one of: ${Object.values(Department).join(', ')}`,
      );
    }

    // Junior students shouldn't have a department (except NONE)
    if (!isSeniorStudent && normalizedDept !== Department.NONE) {
      throw new Error(
        `${studentLevel} students should not have a department. Department should be NONE or empty.`,
      );
    }

    return normalizedDept as Department;
  }

  /**
   * Check if a student level requires a department
   */
  static requiresDepartment(studentLevel: StudentLevel): boolean {
    return this.SENIOR_LEVELS.includes(studentLevel);
  }
}
