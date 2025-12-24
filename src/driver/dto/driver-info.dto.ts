import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Allow,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateDriverInfoDto {
  @ApiProperty({
    description: '12-digit driver license number',
    example: '123456789012',
    minLength: 12,
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  @MinLength(12)
  licenseNumber: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Photo of the driver license',
  })
  @Allow()
  licensePhoto: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile photo of the driver',
  })
  @Allow()
  profilePhoto: any;
}
