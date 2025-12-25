import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RiderService } from '../rider/rider.service';
import { DriverService } from 'src/driver/driver.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { PasswordUtil } from '../common/utils/password.utils';
import { CreateDriverUserDto, CreateRiderUserDto } from './dto/create-user-dto';
import { GoogleLoginDto } from './dto/google-login-dto';
import { PinoLogger } from 'nestjs-pino';

// Mock PasswordUtil
jest.mock('../common/utils/password.utils', () => ({
  PasswordUtil: {
    hash: jest.fn(),
    verify: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: jest.Mocked<JwtService>;
  let riderService: jest.Mocked<RiderService>;
  let googleStrategy: jest.Mocked<GoogleStrategy>;
  let driverService: jest.Mocked<DriverService>;

  // Mock PinoLogger with all methods used by the service
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  };

  const mockUserRider = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: 'RIDER',
    phone: null,
    googleId: null,
    isVerified: false,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUserDriver = {
    ...mockUserRider,
    role: 'DRIVER',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockRiderService = {
      createRider: jest.fn(),
    };

    const mockDriverService = {
      createDriver: jest.fn(),
    };

    const mockGoogleStrategy = {
      verifyToken: jest.fn(),
      extractUserInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService as any,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RiderService,
          useValue: mockRiderService,
        },
        {
          provide: DriverService,
          useValue: mockDriverService,
        },
        {
          provide: GoogleStrategy,
          useValue: mockGoogleStrategy,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService) as any;
    jwtService = module.get(JwtService);
    riderService = module.get(RiderService);
    googleStrategy = module.get(GoogleStrategy);
    driverService = module.get(DriverService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a rider and return token for valid data', async () => {
      const createUserDto: CreateRiderUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashedPassword123';
      const token = 'jwt-token';

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      (PasswordUtil.hash as jest.Mock).mockResolvedValue(hashedPassword);

      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUserRider,
        password: hashedPassword,
      });

      riderService.createRider.mockResolvedValue({
        id: '1',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUserRider,
      } as any);

      jwtService.sign.mockReturnValue(token);

      const result = await service.registerRider(createUserDto);

      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: createUserDto.email },
            ...(createUserDto.phone ? [{ phone: createUserDto.phone }] : []),
          ],
        },
      });

      expect(PasswordUtil.hash).toHaveBeenCalledWith(createUserDto.password);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: hashedPassword,
          role: 'RIDER',
        },
      });

      expect(riderService.createRider).toHaveBeenCalledWith(mockUserRider.id);
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('User Created Successfully');
      expect(result.token).toBe(token);
      expect(result.data).not.toHaveProperty('password');
    });

    it('should create a driver and return token for valid data', async () => {
      const createUserDto: CreateDriverUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashedPassword123';
      const token = 'jwt-token';

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      (PasswordUtil.hash as jest.Mock).mockResolvedValue(hashedPassword);

      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUserDriver,
        password: hashedPassword,
      });

      driverService.createDriver.mockResolvedValue({
        id: '1',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUserDriver,
      } as any);

      jwtService.sign.mockReturnValue(token);

      const result = await service.registerDriver(createUserDto);

      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: {
          OR: [{ email: createUserDto.email }],
        },
      });

      expect(PasswordUtil.hash).toHaveBeenCalledWith(createUserDto.password);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: hashedPassword,
          role: 'DRIVER',
        },
      });

      expect(driverService.createDriver).toHaveBeenCalledWith(
        mockUserDriver.id,
      );
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('User Created Successfully');
      expect(result.token).toBe(token);
      expect(result.data).not.toHaveProperty('password');
    });

    it('should throw BadRequestException for duplicate email', async () => {
      const createUserDto: CreateRiderUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(
        mockUserRider,
      );

      await expect(service.registerDriver(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerDriver(createUserDto)).rejects.toThrow(
        'Email already in use',
      );

      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalled();
      expect(prismaService.user.create as jest.Mock).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const token = 'jwt-token';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUserRider,
      );
      (PasswordUtil.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);

      const result = await service.login(email, password);

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
      expect(PasswordUtil.verify).toHaveBeenCalledWith(
        mockUserRider.password,
        password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserRider.id,
        email: mockUserRider.email,
        role: mockUserRider.role,
      });
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Login successful');
      expect(result.data.token).toBe(token);
      expect(result.data.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(email, password)).rejects.toThrow(
        'Email or Password Incorrect',
      );

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
      expect(PasswordUtil.verify).not.toHaveBeenCalled();
    });
  });

  describe('loginWithGoogle', () => {
    it('should return user and token for existing linked user', async () => {
      const googleLoginDto: GoogleLoginDto = {
        googleIdToken: 'google-token',
      };

      const googleTokenPayload = {
        sub: 'google-id-123',
        email: 'test@example.com',
        email_verified: true,
        given_name: 'John',
        family_name: 'Doe',
        picture: 'avatar-url',
      };

      const userInfo = {
        googleId: 'google-id-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
        avatar: 'avatar-url',
      };

      const existingUser = {
        ...mockUserRider,
        googleId: 'google-id-123',
      };

      const token = 'jwt-token';

      (googleStrategy.verifyToken as jest.Mock).mockResolvedValue(
        googleTokenPayload,
      );
      (googleStrategy.extractUserInfo as jest.Mock).mockReturnValue(userInfo);

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(
        existingUser,
      );
      jwtService.sign.mockReturnValue(token);

      const result = await service.loginWithGoogle(googleLoginDto);

      expect(googleStrategy.verifyToken).toHaveBeenCalledWith(
        googleLoginDto.googleIdToken,
      );
      expect(googleStrategy.extractUserInfo).toHaveBeenCalledWith(
        googleTokenPayload,
      );
      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: { email: userInfo.email, deletedAt: null },
      });
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Login successful');
      expect(result.data.token).toBe(token);
      expect(result.data.user).not.toHaveProperty('password');
      expect(result.data.user).not.toHaveProperty('googleId');
    });

    it('should create new user and return token for new Google user', async () => {
      const googleLoginDto: GoogleLoginDto = {
        googleIdToken: 'google-token',
      };

      const googleTokenPayload = {
        sub: 'google-id-123',
        email: 'newuser@example.com',
        email_verified: true,
        given_name: 'Jane',
        family_name: 'Smith',
        picture: 'avatar-url',
      };

      const userInfo = {
        googleId: 'google-id-123',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        emailVerified: true,
        avatar: 'avatar-url',
      };

      const newUser = {
        ...mockUserRider,
        id: '2',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        googleId: 'google-id-123',
        password: null,
        isVerified: true,
        avatar: 'avatar-url',
      };

      const token = 'jwt-token';

      googleStrategy.verifyToken.mockResolvedValue(googleTokenPayload);
      googleStrategy.extractUserInfo.mockReturnValue(userInfo);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);
      riderService.createRider.mockResolvedValue({
        id: '1',
        userId: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: newUser,
      } as any);
      jwtService.sign.mockReturnValue(token);

      const result = await service.loginWithGoogle(googleLoginDto);

      expect(googleStrategy.verifyToken).toHaveBeenCalledWith(
        googleLoginDto.googleIdToken,
      );
      expect(googleStrategy.extractUserInfo).toHaveBeenCalledWith(
        googleTokenPayload,
      );
      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: { email: userInfo.email, deletedAt: null },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: userInfo.email,
          firstName: 'Jane',
          lastName: 'Smith',
          password: null,
          googleId: userInfo.googleId,
          isVerified: userInfo.emailVerified,
          avatar: userInfo.avatar,
          role: 'RIDER',
        },
      });
      expect(riderService.createRider).toHaveBeenCalledWith(newUser.id);
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('User created and logged in successfully');
      expect(result.data.token).toBe(token);
      expect(result.data.user).not.toHaveProperty('password');
      expect(result.data.user).not.toHaveProperty('googleId');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const googleLoginDto: GoogleLoginDto = {
        googleIdToken: 'google-token',
      };

      (googleStrategy.verifyToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      await expect(service.loginWithGoogle(googleLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.loginWithGoogle(googleLoginDto)).rejects.toThrow(
        'Invalid token',
      );

      // and ensure extractUserInfo was never called
      expect(googleStrategy.extractUserInfo).not.toHaveBeenCalled();
    });
  });
});
