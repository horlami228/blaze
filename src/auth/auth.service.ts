import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateRiderUserDto } from './dto/create-user-dto';
import { RiderService } from 'src/rider/rider.service';
import { PasswordUtil } from 'src/common/utils/password.utils';
import { GoogleStrategy } from './strategy/google.strategy';
import { GoogleLoginDto } from './dto/google-login-dto';
import { DriverService } from 'src/driver/driver.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private riderService: RiderService,
    private googleStrategy: GoogleStrategy,
    private driverService: DriverService,
    private readonly logger: PinoLogger,
  ) {}

  async registerRider(data: CreateRiderUserDto) {
    return this.processRegistration(data, 'RIDER', async (user) => {
      if (user.role === 'RIDER') {
        await this.riderService.createRider(user.id);
      }
    });
  }

  async registerDriver(data: CreateRiderUserDto) {
    return this.processRegistration(data, 'DRIVER', async (user) => {
      if (user.role === 'DRIVER') {
        await this.driverService.createDriver(user.id);
      }
    });
  }

  private async processRegistration(
    data: CreateRiderUserDto,
    roleOverride: 'DRIVER' | 'RIDER',
    onSuccess: (user: any) => Promise<void>,
  ) {
    // check if email already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      this.logger.warn(
        { email: data.email, phone: data.phone },
        'Registration failed - email or phone already in use',
      );
      throw new BadRequestException(
        existing.email === data.email
          ? 'Email already in use'
          : 'Phone number already in use',
      );
    }

    // hash password with Argon2
    const password = await PasswordUtil.hash(data.password);

    // create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password,
        ...(roleOverride ? { role: roleOverride } : {}),
      },
    });

    this.logger.info(
      { userId: user.id, role: user.role },
      'User registered successfully',
    );

    await onSuccess(user);

    return {
      statusCode: 201,
      message: 'User Created Successfully',
      data: await this.sanitizeUser(user),
      token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
    };
  }

  // Login Service
  async login(email: string, plainPassword: string) {
    this.logger.info({ email }, 'Login attempt');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn({ email }, 'Login failed - user not found');
      throw new UnauthorizedException('Email or Password Incorrect');
    }

    const passwordValid = await PasswordUtil.verify(
      user.password,
      plainPassword,
    );
    if (!passwordValid) {
      this.logger.warn(
        { email, userId: user.id },
        'Login failed - invalid password',
      );
      throw new UnauthorizedException('Email or Password Incorrect');
    }

    // Generate JWT

    this.logger.debug({ userId: user.id }, 'Generating JWT for user');
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    this.logger.debug({ payload }, 'JWT payload signed');

    this.logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      statusCode: 201,
      message: 'Login successful',
      data: {
        user: await this.sanitizeUser(user),
        token,
      },
    };
  }

  async loginWithGoogle(data: GoogleLoginDto) {
    try {
      // Verify Google ID token
      const verified = await this.googleStrategy.verifyToken(
        data.googleIdToken,
      );

      // Extract user information from token
      const userInfo = this.googleStrategy.extractUserInfo(verified);
      this.logger.info({ email: userInfo.email }, 'Google login attempt');

      // Check if user exists by email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userInfo.email },
      });

      if (existingUser) {
        // User exists - check account linking
        if (existingUser.googleId === userInfo.googleId) {
          // Account is linked - allow login
          const payload = {
            sub: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
          };
          const token = this.jwtService.sign(payload);

          return {
            statusCode: 201,
            message: 'Login successful',
            data: {
              user: await this.sanitizeUser(existingUser),
              token,
            },
          };
        } else {
          // Account exists but not linked
          throw new BadRequestException(
            'Account exists. Please link your Google account in app settings after verifying your email.',
          );
        }
      } else {
        // User doesn't exist - create new account with Google OAuth
        const newUser = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            firstName:
              userInfo.firstName.trim().charAt(0).toUpperCase() +
              userInfo.firstName.trim().slice(1).toLowerCase(),
            lastName:
              userInfo.lastName.trim().charAt(0).toUpperCase() +
              userInfo.lastName.trim().slice(1).toLowerCase(),
            password: null,
            googleId: userInfo.googleId,
            isVerified: userInfo.emailVerified,
            avatar: userInfo.avatar,
            role: 'RIDER',
          },
        });

        // Create Rider entity if role is RIDER
        if (newUser.role === 'RIDER') {
          await this.riderService.createRider(newUser.id);
        }

        // Create Driver entity if role is DRIVER
        if (newUser.role === 'DRIVER') {
          await this.prisma.driver.create({
            data: { userId: newUser.id },
          });
        }

        // Generate JWT token
        const payload = {
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
        };
        const token = this.jwtService.sign(payload);

        return {
          statusCode: 201,
          message: 'User created and logged in successfully',
          data: {
            user: await this.sanitizeUser(newUser),
            token,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        {
          error: error.message,
          stack: error.stack,
          email: data.googleIdToken ? 'Google Token' : 'Unknown',
        },
        'Google authentication failure',
      );
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException(
        'Failed to authenticate with Google: ' + error.message,
      );
    }
  }

  // Clean up the User data to remove password
  async sanitizeUser(user: any) {
    const { password, googleId, ...rest } = user;
    return rest;
  }
}
