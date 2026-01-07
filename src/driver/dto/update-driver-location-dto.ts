import { createZodDto } from 'nestjs-zod';
import { UpdateDriverLocationSchema } from '@blaze/shared';

export class UpdateDriverLocationDto extends createZodDto(
  UpdateDriverLocationSchema,
) {}
