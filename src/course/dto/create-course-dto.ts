import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Max,
} from 'class-validator';
import { Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto implements Prisma.CourseCreateInput {
  @ApiProperty({
    description: 'The title of the course',
    example: 'Biology',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  title: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the course content',
    example: 'This course covers human evolution',
  })
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  description?: string;
}
