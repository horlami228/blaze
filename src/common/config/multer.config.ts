// src/common/config/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export interface MulterConfigOptions {
  /**
   * Array of allowed MIME types (e.g., ['image/jpeg', 'image/png'])
   * If not provided, all file types are allowed
   */
  allowedMimeTypes?: string[];

  /**
   * Maximum file size in bytes
   * Default: 5MB
   */
  maxFileSize?: number;

  /**
   * Field name for the file upload
   * Default: 'file'
   */
  fieldName?: string;
}

export function createMulterOptions(
  options: MulterConfigOptions = {},
): MulterOptions {
  const {
    allowedMimeTypes,
    maxFileSize = 5 * 1024 * 1024, // Default 5MB
  } = options;

  return {
    storage: memoryStorage(), // Store in memory for R2 upload
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: (req, file, callback) => {
      // Validate MIME type if restrictions are provided
      if (allowedMimeTypes && allowedMimeTypes.length > 0) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          const allowedTypes = allowedMimeTypes
            .map((type) => type.split('/')[1].toUpperCase())
            .join(', ');

          return callback(
            new BadRequestException(
              `Invalid file type. Only ${allowedTypes} files are allowed.`,
            ),
            false,
          );
        }
      }

      // File is valid
      callback(null, true);
    },
  };
}
