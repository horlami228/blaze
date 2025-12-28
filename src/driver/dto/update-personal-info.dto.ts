import { createZodDto } from 'nestjs-zod';
import { DriverPersonalInfoSchema } from '@blaze/shared';

export class UpdateDriverPersonalInfoDto extends createZodDto(
  DriverPersonalInfoSchema,
) {}
