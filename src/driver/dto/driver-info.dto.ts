import { createZodDto } from 'nestjs-zod';
import { DriverInfoSchema } from '@blaze/shared';

export class UpdateDriverInfoDto extends createZodDto(DriverInfoSchema) {}
