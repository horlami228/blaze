import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { CreateDriverUserDto, CreateRiderUserDto } from './dto/create-user-dto';
import { Public } from './decorators/public.decorators';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { GoogleLoginDto } from './dto/google-login-dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register-rider')
  @ApiOperation({ summary: 'Create a new rider' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'User Created Successfully',
        data: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'STUDENT',
          isVerified: false,
          createdAt: '2025-11-17T10:00:00.000Z',
          updatedAt: '2025-11-17T10:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'email must be an email',
          'password should not be empty',
          'firstName should not be empty',
          'lastName should not be empty',
        ],
      },
    },
  })
  createUser(@Body() createRiderUserDto: CreateRiderUserDto) {
    return this.authService.registerRider(createRiderUserDto);
  }

  @Public()
  @Post('register-driver')
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'User Created Successfully',
        data: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DRIVER',
          isVerified: false,
          createdAt: '2025-11-17T10:00:00.000Z',
          updatedAt: '2025-11-17T10:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'email must be an email',
          'password should not be empty',
          'firstName should not be empty',
          'lastName should not be empty',
        ],
      },
    },
  })
  createDriver(@Body() createDriverUserDto: CreateDriverUserDto) {
    return this.authService.registerDriver(createDriverUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'STUDENT',
            isVerified: true,
          },
          token: 'jwt.token.here',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Login/register a user with google oAuth' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'STUDENT',
            isVerified: true,
          },
          token: 'jwt.token.here',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  loginWithGoogle(@Body() googleToken: GoogleLoginDto) {
    return this.authService.loginWithGoogle(googleToken);
  }
}
