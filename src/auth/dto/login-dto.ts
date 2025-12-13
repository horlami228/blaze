import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
