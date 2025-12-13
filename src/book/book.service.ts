import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Book } from './book.model';
import { Book } from '@prisma/client';
import { CreateBookDto } from './dto/create-book-dto';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async getAllBook(): Promise<Book[]> {
    console.log('here');
    return this.prisma.book.findMany();
  }

  async createBook(data: CreateBookDto): Promise<Book> {
    return this.prisma.book.create({ data });
  }
}
