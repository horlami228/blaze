import { CreateVehicleSchema } from '@blaze/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
