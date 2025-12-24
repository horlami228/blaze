import { VehicleColor } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Manufacturing year of the vehicle',
    example: 2022,
    minimum: 2000,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  vehicleYear: number;

  @ApiProperty({
    description: 'Color of the vehicle',
    enum: VehicleColor,
    example: VehicleColor.BLACK,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(VehicleColor)
  vehicleColor: VehicleColor;

  @ApiProperty({
    description: 'ID of the vehicle model',
    example: 'uuid-of-model',
  })
  @IsNotEmpty()
  @IsString()
  modelId: string;

  @ApiProperty({
    description: '9-character plate number',
    example: 'ABC-123-XY',
    minLength: 9,
    maxLength: 9,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(9)
  @MinLength(9)
  plateNumber: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Exterior photo of the vehicle',
  })
  @Allow()
  exteriorPhoto: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Interior photo of the vehicle',
  })
  @Allow()
  interiorPhoto: any;
}
