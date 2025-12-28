import { createZodDto } from 'nestjs-zod';
import { CreateDriverUserSchema, CreateRiderUserSchema } from '@blaze/shared';

export class CreateRiderUserDto extends createZodDto(CreateRiderUserSchema) {}

export class CreateDriverUserDto extends createZodDto(CreateDriverUserSchema) {}
