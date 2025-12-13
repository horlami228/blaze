import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookController } from './book.controller';

@Module({
  controllers: [BookController],
  providers: [BookService, PrismaService],
})
export class BookModule {}
