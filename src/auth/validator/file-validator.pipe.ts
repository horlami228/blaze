import {
  Injectable,
  PipeTransform,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { extname } from 'path';

export function getFileValidator(): PipeTransform {
  return new ParseFilePipeDocument();
}

@Injectable()
export class ParseFilePipeDocument implements PipeTransform {
  // Max size (5MB)
  private readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

  private readonly allowedExtensions = [
    '.png',
    '.pdf',
    '.jpeg',
    '.jpg',
    '.csv',
    '.txt',
  ];

  transform(value: Express.Multer.File): Express.Multer.File {
    if (!value) {
      // Use 422 for when the file parameter is missing entirely
      throw new HttpException(
        'Validation failed (No file provided)',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // --- 1. FILE SIZE CHECK (NEW) ---
    if (value.size > this.MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = this.MAX_FILE_SIZE_BYTES / (1024 * 1024);
      throw new HttpException(
        `Validation failed (File size is too large. Max size allowed is ${maxSizeMB}MB)`,
        HttpStatus.UNPROCESSABLE_ENTITY, // Returns 422
      );
    }

    // --- 2. EXTENSION CHECK ---
    const extension = extname(value.originalname).toLowerCase(); // Added .toLowerCase() for safety

    if (!this.allowedExtensions.includes(extension)) {
      // Use 422 for file type validation failure
      throw new HttpException(
        `Validation failed (File type ${extension} not supported. Allowed types: ${this.allowedExtensions.join(', ')} )`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return value;
  }
}
