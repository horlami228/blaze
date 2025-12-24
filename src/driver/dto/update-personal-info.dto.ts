import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsDate, IsEnum } from 'class-validator';

export class UpdateDriverPersonalInfoDto {
  @ApiProperty({
    description: 'Phone number of the driver',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Date of birth of the driver',
    example: '1990-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Gender of the driver',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;
}
