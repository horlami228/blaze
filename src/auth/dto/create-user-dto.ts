import { $Enums, Prisma } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto implements Prisma.UserCreateInput {
  @ApiProperty({ description: 'User email', example: 'test@example.com' })
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'User password', example: 'StrongPassword123!' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'First name of the user', example: 'John' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: 'Gender of the user',
    enum: $Enums.Gender,
    example: $Enums.Gender.MALE,
  })
  @IsEnum($Enums.Gender)
  @IsNotEmpty()
  gender?: $Enums.Gender;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL of user avatar',
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Date of birth of the user',
    type: String, // Swagger shows dates as string
    example: '2000-01-01T00:00:00.000Z',
  })
  // @IsDate()
  // @Type(() => Date) // transforms incoming string into Date
  // dateOfBirth?: Date;
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date | string;
}
