import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherInfoDto } from './teacher-info-dto';

export class CourseResponseDto {
  @ApiProperty({ description: 'The UUID of the course', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Biology' })
  title: string;

  @ApiPropertyOptional({ example: 'A course about evolution of life' })
  description?: string;

  @ApiProperty({
    description: 'The UUID of the teacher who created the course',
    format: 'uuid',
  })
  teacherId: string;

  @ApiProperty({
    description: 'The creation date of the course',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update date of the course',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    type: TeacherInfoDto,
    description: 'Information about the course teacher',
  })
  teacher: TeacherInfoDto;

  // Use ApiPropertyOptional if this count is only included in certain endpoints (like findAll/findByTeacher)
  @ApiPropertyOptional({
    description: 'The total number of students enrolled in the course',
    example: 5,
  })
  _count?: {
    enrollments: number;
  };
}
