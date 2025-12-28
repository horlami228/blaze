import { createZodDto } from 'nestjs-zod';
import { GoogleLoginSchema } from '@blaze/shared';

export class GoogleLoginDto extends createZodDto(GoogleLoginSchema) {}
