import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Google ID token obtained from Google Sign-In client',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2M...',
  })
  googleIdToken: string;
}
