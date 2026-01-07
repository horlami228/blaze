import { createZodDto } from 'nestjs-zod';
import { NearByDriverSchema } from '@blaze/shared';

export class NearbyDriverDto extends createZodDto(NearByDriverSchema) {}
