import { createZodDto } from 'nestjs-zod';
import { LoginSchema } from '@blaze/shared';

export class LoginDto extends createZodDto(LoginSchema) {}
