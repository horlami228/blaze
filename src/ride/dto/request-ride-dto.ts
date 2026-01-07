import { createZodDto } from 'nestjs-zod';
import { RequestRideSchema } from '@blaze/shared';

export class RequestRideDto extends createZodDto(RequestRideSchema) {}
