import { Prisma } from '@prisma/client';
import { IsString, IsOptional } from 'class-validator';

export class CreateBookDto implements Prisma.BookCreateInput {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
