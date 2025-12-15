import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateRiderUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
import { GoogleLoginDto } from './dto/google-login-dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockRegisterResponse = {
    statusCode: 201,
    message: 'User Created Successfully',
    data: {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'RIDER',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    token: 'jwt-token',
  };

  const mockLoginResponse = {
    statusCode: 201,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'RIDER' as const,
        isVerified: false,
        phone: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'jwt-token',
    },
  };

  const mockGoogleLoginResponse = {
    statusCode: 201,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'RIDER' as const,
        isVerified: true,
        phone: null,
        avatar: 'avatar-url',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'jwt-token',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return response', async () => {
      const createUserDto: CreateRiderUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      authService.register.mockResolvedValue(mockRegisterResponse);

      const result = await controller.createUser(createUserDto);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockRegisterResponse);
      expect(result.statusCode).toBe(201);
      expect(result.token).toBeDefined();
    });
  });

  describe('login', () => {
    it('should call authService.login and return response', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(result).toEqual(mockLoginResponse);
      expect(result.statusCode).toBe(201);
      expect(result.data.token).toBeDefined();
    });
  });

  describe('loginWithGoogle', () => {
    it('should call authService.loginWithGoogle and return response', async () => {
      const googleLoginDto: GoogleLoginDto = {
        googleIdToken: 'google-token',
      };

      authService.loginWithGoogle.mockResolvedValue(mockGoogleLoginResponse);

      const result = await controller.loginWithGoogle(googleLoginDto);

      expect(authService.loginWithGoogle).toHaveBeenCalledWith(googleLoginDto);
      expect(result).toEqual(mockGoogleLoginResponse);
      expect(result.statusCode).toBe(201);
      expect(result.data.token).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const dto = { googleIdToken: 'bad-token' };

      (authService.loginWithGoogle as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      await expect(controller.loginWithGoogle(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.loginWithGoogle).toHaveBeenCalledWith(dto);
    });
  });
});
