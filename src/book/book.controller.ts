import { Body, Controller, Get, Post } from '@nestjs/common';
import { Book } from './book.model';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book-dto';

@Controller('api/v1/book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async getAllBook(): Promise<Book[]> {
    return this.bookService.getAllBook();
  }

  @Post()
  createBook(@Body() createBookDto: CreateBookDto) {
    return this.bookService.createBook(createBookDto);
  }
}
