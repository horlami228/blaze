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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRiderUserDto implements Prisma.UserCreateInput {
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

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateDriverUserDto implements Prisma.UserCreateInput {
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

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
