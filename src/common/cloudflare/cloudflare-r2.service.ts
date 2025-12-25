import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { R2Bucket } from '../enums/bucket.enum';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class CloudflareR2Service {
  private readonly s3Client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.get('CLOUD_FLARE_R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get('CLOUD_FLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('CLOUD_FLARE_R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getPresignedDownloadUrl(
    bucket: R2Bucket,
    key: string,
    expiresSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresSeconds,
    });
  }

  // Validate file type
  private validateFileType(
    file: Express.Multer.File,
    allowedMimeTypes?: string[],
  ): void {
    if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
      return; // No restrictions
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      const allowedTypes = allowedMimeTypes
        .map((type) => type.split('/')[1])
        .join(', ');
      throw new BadRequestException(
        `Invalid file type. Only ${allowedTypes} files are allowed.`,
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    bucket: R2Bucket,
    allowedMimeTypes?: string[],
  ): Promise<string> {
    // Validate file type if restrictions are provided
    this.validateFileType(file, allowedMimeTypes);

    const fileExtension = file.mimetype.split('/')[1];
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await this.s3Client.send(command);
    return key;
  }
}
